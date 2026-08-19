import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  Modal,
  message,
  Popconfirm,
  Descriptions,
  Form,
  InputNumber,
  Select,
  DatePicker,
  Input,
} from 'antd';
import {
  CalendarOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  DollarOutlined,
  CreditCardOutlined,
  RollbackOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { BookingResponse } from '../types';
import { adminApi } from '../api/adminApi';

import { adminCourtApi } from '../api/adminCourtApi';
import { CheckoutModal } from '../components/CheckoutModal';
import {
  formatDateTime,
  formatDate,
  formatTime,
  bookingStatusLabels,
  bookingStatusColors,
} from '../utils/formatters';

const { Title, Text } = Typography;

export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailBooking, setDetailBooking] = useState<BookingResponse | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<BookingResponse | null>(null);

  // 下拉選單用：球場與使用者資料選單
  const [courtOptions, setCourtOptions] = useState<{ id: number; name: string; hourlyRate: number }[]>([]);
  const [userOptions, setUserOptions] = useState<{ id: number; username: string }[]>([]);

  // 櫃檯結帳 Modal 狀態
  const [checkoutBooking, setCheckoutBooking] = useState<BookingResponse | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [form] = Form.useForm();

  // 🎯 限制時間選單：營業時間 08:00 ~ 22:00，且分鐘固定為 00
  const disabledDateTime = () => ({
    disabledHours: () => {
      const hours = [];
      for (let i = 0; i < 24; i++) {
        if (i < 8 || i > 22) {
          hours.push(i);
        }
      }
      return hours;
    },
    disabledMinutes: () => {
      const minutes = [];
      for (let i = 1; i < 60; i++) {
        minutes.push(i);
      }
      return minutes;
    },
  });

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAllBookings();
      setBookings(data.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()));
    } catch (err) {
      message.error('載入預約紀錄失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入球場與使用者選單選項
  const loadOptions = async () => {
    try {
      const courts = await adminCourtApi.getAllCourts();
      setCourtOptions(courts.map((c: any) => ({ id: c.id, name: c.name, hourlyRate: c.hourlyRate })));

      if (adminApi.getAllUsers) {
        const users = await adminApi.getAllUsers();
        setUserOptions(users.map((u: any) => ({ id: u.id, username: u.username })));
      }
    } catch (err) {
      console.error('載入選單選項失敗', err);
    }
  };

  useEffect(() => {
    loadBookings();
    loadOptions();
  }, []);

  // 取消預約
  const handleCancel = async (id: number) => {
    try {
      await adminApi.cancelBooking(id);
      message.success('已取消該筆預約');
      await loadBookings();
    } catch (err) {
      message.error('取消預約失敗，請確認權限');
    }
  };

  // 退費處理
  const handleRefund = async (id: number) => {
    try {
      await adminApi.refundBooking(id);
      message.success('已完成退費手續並寫入財務沖銷紀錄');
      await loadBookings();
    } catch (err) {
      message.error('退費失敗，請確認該預約狀態是否為已結帳');
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setIsFormOpen(true);
  };

  const openEdit = (b: BookingResponse) => {
    setEditing(b);
    form.setFieldsValue({
      userId: b.userId,
      courtId: b.courtId,
      startTime: b.startTime ? dayjs(b.startTime) : null,
      endTime: b.endTime ? dayjs(b.endTime) : null,
      totalFee: b.totalFee,
      status: b.status,
    });
    setIsFormOpen(true);
  };

  // 開啟結帳 Modal
  const openCheckout = (b: BookingResponse) => {
    setCheckoutBooking(b);
    setIsCheckoutOpen(true);
  };

  // 自動試算費用
  const handleCalculateFee = () => {
    const courtId = form.getFieldValue('courtId');
    const startTime = form.getFieldValue('startTime');
    const endTime = form.getFieldValue('endTime');

    if (courtId && startTime && endTime) {
      const selectedCourt = courtOptions.find((c) => c.id === courtId);
      if (selectedCourt) {
        const hours = dayjs(endTime).diff(dayjs(startTime), 'hour', true);
        if (hours > 0) {
          const estimatedFee = Math.ceil(hours) * selectedCourt.hourlyRate;
          form.setFieldsValue({ totalFee: estimatedFee });
        }
      }
    }
  };

  //建立預約
 const submitForm = async (values: any) => {
   try {
     const payload = {
       courtId: values.courtId,
       userId: values.userId, // 🎯 唯一多出的欄位：手動選擇會員
       // 🎯 明確格式化為 YYYY-MM-DDTHH:mm:ss，與 CourtsPage 保持一致
       startTime: values.startTime ? dayjs(values.startTime).format('YYYY-MM-DDTHH:mm') : null,
       endTime: values.endTime ? dayjs(values.endTime).format('YYYY-MM-DDTHH:mm') : null,
       promoCode: values.promoCode || null,
       status: editing ? values.status : 'CONFIRMED',
     };

     if (editing) {
       await adminApi.updateBooking(editing.id, payload);
       message.success('更新預約成功');
     } else {
       await adminApi.createBooking(payload); // 呼叫 adminApi 寫入資料庫
       message.success('建立預約成功');
     }
     setIsFormOpen(false);
     await loadBookings();
   } catch (err: any) {
     const errorMsg =
       err.response?.data?.message ||
       (typeof err.response?.data === 'string' ? err.response?.data : null) ||
       '儲存預約失敗，請確認該時段是否已被預約';
     message.error(errorMsg);
   }
 };

  const columns = [
    {
      title: '預約編號',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: '使用者',
      dataIndex: 'username',
      key: 'username',
      render: (_: any, record: BookingResponse) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.username}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            #{record.userId}
          </Text>
        </Space>
      ),
    },
    {
      title: '球場',
      dataIndex: 'courtName',
      key: 'courtName',
      render: (name: string) => (
        <Space>
          <TrophyOutlined style={{ color: '#1890ff' }} />
          {name}
        </Space>
      ),
    },
    {
      title: '預約時間',
      key: 'time',
      render: (_: any, record: BookingResponse) => (
        <Space direction="vertical" size={0}>
          <Text>{formatDate(record.startTime)}</Text>
          <Text type="secondary">
            {formatTime(record.startTime)} - {formatTime(record.endTime)}
          </Text>
        </Space>
      ),
    },
    {
      title: '預約狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={bookingStatusColors[status] || 'default'}>
          {bookingStatusLabels[status] || status}
        </Tag>
      ),
    },
    {
      title: '費用',
      dataIndex: 'totalFee',
      key: 'totalFee',
      render: (fee: number) => (
        <Tag color="green">
          <DollarOutlined /> NT${fee}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      render: (_: any, record: BookingResponse) => (
        <Space size="small" wrap>
          {record.status === 'CONFIRMED' && (
            <Button
              type="primary"
              size="small"
              icon={<CreditCardOutlined />}
              onClick={() => openCheckout(record)}
            >
              結帳
            </Button>
          )}

          {record.status === 'COMPLETED' && (
            <>
              <Tag color="green">已結帳</Tag>
              <Popconfirm
                title="因天候/下雨退費？"
                description="確定要辦理此筆預約退費嗎？"
                onConfirm={() => handleRefund(record.id)}
                okText="確認退費"
                cancelText="取消"
              >
                <Button size="small" danger icon={<RollbackOutlined />}>
                  退費
                </Button>
              </Popconfirm>
            </>
          )}

          {record.status === 'REFUNDED' && <Tag color="volcano">已退款</Tag>}

          <Button type="link" icon={<InfoCircleOutlined />} onClick={() => setDetailBooking(record)}>
            詳細
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            編輯
          </Button>

          {record.status === 'CONFIRMED' && (
            <Popconfirm
              title="確定要取消此預約嗎？"
              onConfirm={() => handleCancel(record.id)}
              okText="確認"
              cancelText="取消"
            >
              <Button danger size="small" icon={<CloseCircleOutlined />}>
                取消預約
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>
            <CalendarOutlined /> 全部預約
          </Title>
          <Text type="secondary">管理員可檢視、編輯、現場結帳、下雨退費與管理球場預約紀錄</Text>
        </div>
        <Button type="primary" onClick={openCreate}>建立預約</Button>
      </div>

      <Spin spinning={loading} size="large">
        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Spin>

      {/* 櫃檯結帳 Modal */}
      <CheckoutModal
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        bookingData={checkoutBooking}
        onSuccess={loadBookings}
      />

      {/* 編輯 / 建立彈窗 */}
      <Modal title={editing ? '編輯預約' : '建立預約'} open={isFormOpen} onCancel={() => setIsFormOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={submitForm}>

          {/* 使用者下拉選單 */}
          <Form.Item name="userId" label="使用者" rules={[{ required: true, message: '請選擇使用者' }]}>
            <Select
              showSearch
              placeholder="請選擇使用者"
              optionFilterProp="children"
              options={
                userOptions.length > 0
                  ? userOptions.map((u) => ({ value: u.id, label: `${u.username} (#${u.id})` }))
                  : undefined
              }
            />
          </Form.Item>

          {/* 球場下拉選單 */}
          <Form.Item name="courtId" label="球場名稱" rules={[{ required: true, message: '請選擇球場' }]}>
            <Select
              placeholder="請選擇球場"
              onChange={handleCalculateFee}
              options={courtOptions.map((c) => ({
                value: c.id,
                label: `${c.name} (NT$${c.hourlyRate}/小時)`,
              }))}
            />
          </Form.Item>

          {/* 開始時間 */}
          <Form.Item name="startTime" label="開始時間" rules={[{ required: true, message: '請選擇開始時間' }]}>
            <DatePicker
              showTime={{ format: 'HH:mm', minuteStep: 60 }}
              format="YYYY-MM-DD HH:mm"
              disabledTime={disabledDateTime}
              style={{ width: '100%' }}
              onChange={handleCalculateFee}
            />
          </Form.Item>

          {/* 結束時間 */}
          <Form.Item name="endTime" label="結束時間" rules={[{ required: true, message: '請選擇結束時間' }]}>
            <DatePicker
              showTime={{ format: 'HH:mm', minuteStep: 60 }}
              format="YYYY-MM-DD HH:mm"
              disabledTime={disabledDateTime}
              style={{ width: '100%' }}
              onChange={handleCalculateFee}
            />
          </Form.Item>

          {/* 折扣碼欄位 (新建預約時顯示) */}
          {!editing && (
            <Form.Item name="promoCode" label="折扣碼 (可選)">
              <Input placeholder="請輸入折扣碼 (如無可留空)" />
            </Form.Item>
          )}

          {/* 費用金額 */}
          <Form.Item name="totalFee" label="費用 (NT$)" rules={[{ required: true, message: '請輸入費用' }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              prefix="NT$"
              placeholder="選擇時間球場後會自動預算，亦可手動輸入修改"
            />
          </Form.Item>

          {/* 編輯既有預約時才顯示狀態 */}
          {editing && (
            <Form.Item name="status" label="預約狀態" rules={[{ required: true, message: '請選擇狀態' }]}>
              <Select>
                <Select.Option value="CONFIRMED">已預約 (CONFIRMED)</Select.Option>
                <Select.Option value="COMPLETED">已結帳 (COMPLETED)</Select.Option>
                <Select.Option value="REFUNDED">已退款 (REFUNDED)</Select.Option>
                <Select.Option value="CANCELLED">已取消 (CANCELLED)</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsFormOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">儲存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 詳細資訊彈窗 */}
      <Modal
        title="預約詳細資訊"
        open={!!detailBooking}
        onCancel={() => setDetailBooking(null)}
        footer={null}
      >
        {detailBooking && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="預約編號">#{detailBooking.id}</Descriptions.Item>
            <Descriptions.Item label="使用者">{detailBooking.username}</Descriptions.Item>
            <Descriptions.Item label="球場">{detailBooking.courtName}</Descriptions.Item>
            <Descriptions.Item label="時段">
              {formatDateTime(detailBooking.startTime)} - {formatDateTime(detailBooking.endTime)}
            </Descriptions.Item>
            <Descriptions.Item label="狀態">{bookingStatusLabels[detailBooking.status] || detailBooking.status}</Descriptions.Item>
            <Descriptions.Item label="費用">NT${detailBooking.totalFee}</Descriptions.Item>
            <Descriptions.Item label="報到狀態">{detailBooking.checkInStatus || '未報到'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};
