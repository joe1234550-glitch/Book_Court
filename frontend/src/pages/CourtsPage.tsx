import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Typography,
  Empty,
  Spin,
  Modal,
  Form,
  DatePicker,
  TimePicker,
  Space,
  Divider,
  message,
  Alert,
} from 'antd';
import { TrophyOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { Court, BookingResponse } from '../types';
import { courtApi } from '../api/courtApi';
import { bookingApi } from '../api/bookingApi';
import { useAuthStore } from '../store/authStore';
import {
  courtTypeLabels,
  courtStatusLabels,
  courtStatusColors,
} from '../utils/formatters';

const { Title, Text, Paragraph } = Typography;
const { RangePicker: TimeRangePicker } = TimePicker;

export const CourtsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [bookingsForDay, setBookingsForDay] = useState<BookingResponse[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCourts();
  }, []);

  useEffect(() => {
    if (selectedCourt) {
      loadDayBookings();
    }
  }, [selectedCourt, selectedDate]);

  const loadCourts = async () => {
    setLoading(true);
    try {
      const data = await courtApi.getAvailableCourts();
      setCourts(data);
    } catch (err) {
      message.error('載入球場清單失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadDayBookings = async () => {
    if (!selectedCourt) {
      setBookingsForDay([]);
      return;
    }

    try {
      const bookings = await bookingApi.getCourtBookingsByDate(
        selectedCourt.id,
        selectedDate.format('YYYY-MM-DD')
      );
      setBookingsForDay(bookings);
    } catch {
      setBookingsForDay([]);
    }
  };

  const handleOpenBooking = (court: Court) => {
    if (!isAuthenticated) {
      message.warning('請先登入再進行預約');
      navigate('/login');
      return;
    }
    setSelectedCourt(court);
    form.resetFields();
    setIsModalOpen(true);
    loadDayBookings();
  };

  const isSlotBooked = (start: Dayjs, end: Dayjs): boolean => {
    return bookingsForDay.some((b) => {
      const bStart = dayjs(b.startTime);
      const bEnd = dayjs(b.endTime);
      return start.isBefore(bEnd) && end.isAfter(bStart) && b.status !== 'CANCELLED';
    });
  };

  const handleBooking = async (values: {
    timeRange: [Dayjs, Dayjs];
  }) => {
    if (!selectedCourt) return;
    const [startTime, endTime] = values.timeRange;
    const start = selectedDate
      .hour(startTime.hour())
      .minute(startTime.minute())
      .second(0);
    const end = selectedDate
      .hour(endTime.hour())
      .minute(endTime.minute())
      .second(0);

    if (start.isBefore(dayjs())) {
      message.error('預約時間不能是過去時間');
      return;
    }
    if (start.isAfter(end) || start.isSame(end)) {
      message.error('結束時間必須晚於開始時間');
      return;
    }
    if (isSlotBooked(start, end)) {
      message.error('此時段已被預約，請選擇其他時間');
      return;
    }

    setBookingLoading(true);
    try {
      const duration = Math.ceil(end.diff(start, 'minute') / 60);
      const totalFee = duration * selectedCourt.hourlyRate;

      // 🎯 修正點 1：將計算出來的 totalFee 帶入 API 請求
      await bookingApi.createBooking({
        courtId: selectedCourt.id,
        startTime: start.format('YYYY-MM-DDTHH:mm:ss'),
        endTime: end.format('YYYY-MM-DDTHH:mm:ss'),
        totalFee: totalFee,
      } as any);

      message.success(
        `預約成功！${selectedCourt.name}\n${start.format('YYYY-MM-DD HH:mm')} - ${end.format('HH:mm')}\n費用: NT$${totalFee}`
      );
      setIsModalOpen(false);
      await loadDayBookings();
    } catch (err: any) {
      // 🎯 修正點 2：解析後端回傳的物件訊息，確保能正常印出文字
      if (err.response?.status === 409) {
        message.error('時段衝突！該球場此時段已被預約');
      } else {
        const errorMsg = err.response?.data?.message || err.response?.data;
        message.error(typeof errorMsg === 'string' ? errorMsg : '預約失敗，請稍後再試');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const renderCourtTypeIcon = (type: string) => {
    switch (type) {
      case 'HARD': return '🟦';
      case 'GRASS': return '🟩';
      case 'CLAY': return '🟫';
      default: return '🎾';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          <TrophyOutlined /> 球場預約
        </Title>
        <Text type="secondary">選擇您喜愛的球場，預約美好時光！</Text>
      </div>

      <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
        <Text strong>選擇預約日期</Text>
        <DatePicker
          value={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          disabledDate={(current) => current && current.isBefore(dayjs().startOf('day'))}
          size="large"
        />
      </Space>
      <Spin spinning={loading} size="large">
        {courts.length === 0 && !loading ? (
          <Empty description="目前沒有開放中的球場" />
        ) : (
          <Row gutter={[24, 24]}>
            {courts.map((court) => (
              <Col xs={24} md={12} lg={8} key={court.id}>
                <Card
                  hoverable
                  actions={[
                    <Button
                      key="book"
                      type="primary"
                      size="large"
                      onClick={() => handleOpenBooking(court)}
                      disabled={court.status !== 'AVAILABLE'}
                    >
                      立即預約
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <div style={{ fontSize: 36 }}>
                        {renderCourtTypeIcon(court.type)}
                      </div>
                    }
                    title={
                      <Space>
                        <Text strong style={{ fontSize: 18 }}>
                          {court.name}
                        </Text>
                        <Tag color={courtStatusColors[court.status]}>
                          {courtStatusLabels[court.status]}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Space style={{ marginBottom: 8 }}>
                          <Tag color="blue">{courtTypeLabels[court.type]}</Tag>
                          <Tag>
                            <DollarOutlined /> NT${court.hourlyRate}/小時
                          </Tag>
                        </Space>
                        <Paragraph
                          ellipsis={{ rows: 2 }}
                          style={{ marginBottom: 0, minHeight: 44 }}
                        >
                          {court.description || '暫無描述'}
                        </Paragraph>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      <Modal
        title={
          selectedCourt ? (
            <Space>
              <span style={{ fontSize: 24 }}>
                {renderCourtTypeIcon(selectedCourt.type)}
              </span>
              <span>預約 {selectedCourt.name}</span>
            </Space>
          ) : (
            '預約球場'
          )
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        {selectedCourt && (
          <>
            <Alert
              message={
                <Space>
                  <ClockCircleOutlined />
                  費用計算：NT${selectedCourt.hourlyRate} × 小時數（無條件進位）
                </Space>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form form={form} layout="vertical" onFinish={handleBooking}>
              <Form.Item label="預約日期">
                <Text>{selectedDate.format('YYYY-MM-DD')}</Text>
              </Form.Item>

              <Form.Item
                label="選擇預約時段"
                name="timeRange"
                rules={[{ required: true, message: '請選擇預約時段' }]}
              >
                <TimeRangePicker
                  format="HH:mm"
                  minuteStep={30}
                  size="large"
                  style={{ width: '100%' }}
                  disabledHours={() => {
                    const disabled: number[] = [];
                    for (let i = 0; i < 6; i++) disabled.push(i);
                    for (let i = 22; i <= 23; i++) disabled.push(i);
                    return disabled;
                  }}
                />
              </Form.Item>

              <Divider orientation="left">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  📅 {selectedDate.format('YYYY-MM-DD')} 當日已預約時段
                </Text>
              </Divider>

              <div style={{ marginBottom: 16 }}>
                {bookingsForDay.filter((b) => b.status !== 'CANCELLED').length === 0 ? (
                  <Text type="secondary">當日尚無預約，時段全部開放！</Text>
                ) : (
                  <Space wrap>
                    {bookingsForDay
                      .filter((b) => b.status !== 'CANCELLED')
                      .map((b) => (
                        <Tag color="orange" key={b.id}>
                          {dayjs(b.startTime).format('HH:mm')} -{' '}
                          {dayjs(b.endTime).format('HH:mm')}
                          <Tag color="red" style={{ marginLeft: 4 }}>
                            已預約
                          </Tag>
                        </Tag>
                      ))}
                  </Space>
                )}
              </div>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => setIsModalOpen(false)} size="large">
                    取消
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={bookingLoading}
                    size="large"
                  >
                    確認預約
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};
