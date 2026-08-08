import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  DatePicker,
  TimePicker,
  Modal,
  Input,
  message,
  Typography,
  Tag,
  Row,
  Col,
  Space,
  Form,
  Divider,
  Spin,
} from 'antd';
import { TagOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import client from '../api/client';

const { Title, Text } = Typography;

interface Court {
  id: number;
  name: string;
  hourlyRate: number;
  description?: string;
}

interface ExistingBooking {
  courtId?: number;
  court?: { id: number };
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  status?: string;
}

export const CourtsPage: React.FC = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 日期與時間
  const [form] = Form.useForm();
  const [bookingDate, setBookingDate] = useState<Dayjs | null>(dayjs());
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs] | null>(null);

  // 已預約時段清單與載入狀態
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);

  // 折扣碼相關 State
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [validatingCode, setValidatingCode] = useState<boolean>(false);

  useEffect(() => {
    fetchCourts();
  }, []);

  // 當選擇球場、日期變更或開啟 Modal 時，自動查詢已被預約的時段
  useEffect(() => {
    if (selectedCourt && bookingDate && isModalOpen) {
      fetchExistingBookings(selectedCourt.id, bookingDate);
    }
  }, [selectedCourt, bookingDate, isModalOpen]);

  const fetchCourts = async () => {
    try {
      const res = await client.get('/v1/courts');
      setCourts(res.data?.data ?? res.data ?? []);
    } catch (err) {
      message.error('無法取得球場資料');
    }
  };

  // 🎯 強化版：向後端取得預約，並兼容各種時區與欄位格式進行嚴格比對
  const fetchExistingBookings = async (courtId: number, date: Dayjs) => {
    setLoadingBookings(true);
    try {
      const res = await client.get('/v1/bookings');
      // 自動解套不同的層級結構
      const rawList = res.data?.data ?? res.data ?? [];
      const allBookings: ExistingBooking[] = Array.isArray(rawList) ? rawList : [];

      const selectedDateStr = date.format('YYYY-MM-DD');

      // 篩選出同球場、同日期、且非取消狀態的預約
      const filtered = allBookings.filter((b) => {
        const cId = b.courtId ?? b.court?.id;
        const startRaw = b.startTime || b.start_time;

        if (!cId || !startRaw) return false;

        // 使用本地時間轉換，避免 UTC 導致的跨日問題
        const bDateStr = dayjs(startRaw).format('YYYY-MM-DD');
        const isNotCanceled = b.status !== 'CANCELLED' && b.status !== 'CANCELED';

        return Number(cId) === Number(courtId) && bDateStr === selectedDateStr && isNotCanceled;
      });

      console.log('當日球場有效預約資料：', filtered);
      setExistingBookings(filtered);
    } catch (err) {
      console.error('取得預約清單失敗：', err);
      setExistingBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleOpenBookingModal = (court: Court) => {
    setSelectedCourt(court);
    setPromoCodeInput('');
    setAppliedPromoCode('');
    setDiscountAmount(0);
    setTimeRange(null);
    setIsModalOpen(true);
  };

  const disabledHours = () => {
    const hours = [];
    for (let i = 0; i < 8; i++) hours.push(i);
    for (let i = 22; i < 24; i++) hours.push(i);
    return hours;
  };

  const handleApplyPromoCode = async () => {
    const code = promoCodeInput.trim();
    if (!code) {
      message.warning('請輸入折扣碼');
      return;
    }

    setValidatingCode(true);
    try {
      const res = await client.get('/v1/coupons/validate', {
        params: { code },
      });

      const promoData = res.data;
      const discount = promoData.discountAmount || 0;

      setDiscountAmount(discount);
      setAppliedPromoCode(code);
      message.success(`折扣碼 [${code}] 套用成功！可折抵 NT$${discount}`);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.response?.data || '無效或已過期的折扣碼';
      message.error(errorMsg);
      setDiscountAmount(0);
      setAppliedPromoCode('');
    } finally {
      setValidatingCode(false);
    }
  };

  const calculateOriginalFee = (): number => {
    if (!selectedCourt || !timeRange) return 0;
    const hours = timeRange[1].diff(timeRange[0], 'hour', true);
    return Math.ceil(hours) * selectedCourt.hourlyRate;
  };

  const originalFee = calculateOriginalFee();
  const finalFee = Math.max(0, originalFee - discountAmount);

  const handleConfirmBooking = async () => {
    try {
      await form.validateFields();
      if (!selectedCourt || !bookingDate || !timeRange) {
        message.error('請填寫完整預約時間');
        return;
      }

      setSubmitting(true);

      const dateStr = bookingDate.format('YYYY-MM-DD');
      const startIso = `${dateStr}T${timeRange[0].format('HH:mm:ss')}`;
      const endIso = `${dateStr}T${timeRange[1].format('HH:mm:ss')}`;

      const payload = {
        courtId: selectedCourt.id,
        startTime: startIso,
        endTime: endIso,
        promoCode: appliedPromoCode || null,
      };

      const res = await client.post('/v1/bookings', payload);
      const bookingData = res.data?.data ?? res.data;

      message.success(`預約成功！實付金額：NT$${bookingData.totalFee ?? finalFee}`);

      setIsModalOpen(false);
      form.resetFields();
      setAppliedPromoCode('');
      setPromoCodeInput('');
      setDiscountAmount(0);

      // 預約成功後立即重新拉取最新的已被預約狀態
      if (selectedCourt && bookingDate) {
        fetchExistingBookings(selectedCourt.id, bookingDate);
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.response?.data || '預約失敗，請重新檢查';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // 🎯 精準時間重疊比對：判斷 08:00 - 22:00 間該 1 小時區間是否被佔用
  const renderTimeSlots = () => {
    const slots = [];
    const dateStr = bookingDate ? bookingDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

    for (let h = 8; h < 22; h++) {
      const hourStr = h.toString().padStart(2, '0');
      const slotStart = dayjs(`${dateStr}T${hourStr}:00:00`);
      const slotEnd = dayjs(`${dateStr}T${hourStr}:59:59`);

      // 檢查此時段是否與已成立的預約重疊
      const isBooked = existingBookings.some((b) => {
        const startRaw = b.startTime || b.start_time;
        const endRaw = b.endTime || b.end_time;
        if (!startRaw || !endRaw) return false;

        const bStart = dayjs(startRaw);
        const bEnd = dayjs(endRaw);

        // 如果 slotStart ~ slotEnd 時間區間與預約時間有交集
        return slotStart.isBefore(bEnd) && slotEnd.isAfter(bStart);
      });

      slots.push(
        <Tag
          key={h}
          color={isBooked ? 'red' : 'green'}
          style={{ marginBottom: 6, padding: '4px 8px', fontSize: '13px' }}
        >
          {hourStr}:00 ~ {(h + 1).toString().padStart(2, '0')}:00 {isBooked ? '❌ (已預約)' : '✅ (可預約)'}
        </Tag>
      );
    }
    return slots;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>球場預約</Title>

      <Row gutter={[16, 16]}>
        {courts.map((court) => (
          <Col xs={24} sm={12} md={8} key={court.id}>
            <Card title={court.name} hoverable>
              <p>{court.description || '標準專用球場'}</p>
              <p>
                <strong>每小時費用：</strong> NT$ {court.hourlyRate}
              </p>
              <Button type="primary" block onClick={() => handleOpenBookingModal(court)}>
                立即預約
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={`預約 - ${selectedCourt?.name || ''}`}
        open={isModalOpen}
        onOk={handleConfirmBooking}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText="確認預約"
        cancelText="取消"
        width={650}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="預約日期" required>
            <DatePicker
              style={{ width: '100%' }}
              value={bookingDate}
              onChange={(date) => setBookingDate(date)}
            />
          </Form.Item>

          {/* 🎯 當日已被預約時段看板 */}
          <div style={{ marginBottom: 16, background: '#fafafa', border: '1px solid #f0f0f0', padding: 12, borderRadius: 6 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              當日各時段預約狀況 (08:00 - 22:00)：
            </Text>
            {loadingBookings ? (
              <Spin size="small" />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {renderTimeSlots()}
              </div>
            )}
          </div>

          <Form.Item label="選擇預約時段 (開放時段：08:00 - 22:00)" required>
            <TimePicker.RangePicker
              style={{ width: '100%' }}
              format="HH:mm"
              minuteStep={30}
              disabledHours={disabledHours}
              onChange={(times) => setTimeRange(times as [Dayjs, Dayjs])}
            />
          </Form.Item>

          <Form.Item label="優惠折扣碼">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="請輸入折扣碼 (例：rf001)"
                prefix={<TagOutlined />}
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
              />
              <Button
                type="primary"
                loading={validatingCode}
                onClick={handleApplyPromoCode}
              >
                確定
              </Button>
            </Space.Compact>
            {appliedPromoCode && (
              <div style={{ marginTop: 8 }}>
                <Tag color="green" icon={<CheckCircleOutlined />}>
                  已套用折扣碼：{appliedPromoCode} (折抵 NT${discountAmount})
                </Tag>
              </div>
            )}
          </Form.Item>

          {timeRange && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>原價費用：</Text>
                <Text>NT$ {originalFee}</Text>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="success">折扣折抵：</Text>
                  <Text type="success">- NT$ {discountAmount}</Text>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <Text strong>應付總金額：</Text>
                <Text strong style={{ fontSize: 18, color: '#1677ff' }}>
                  NT$ {finalFee}
                </Text>
              </div>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default CourtsPage;