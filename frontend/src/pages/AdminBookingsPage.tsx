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
} from 'antd';
import {
  CalendarOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  DollarOutlined,
  CreditCardOutlined,
  RollbackOutlined, // 🎯 匯入退費圖示
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { BookingResponse } from '../types';
import { adminApi } from '../api/adminApi';
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

  // 櫃檯結帳 Modal 狀態
  const [checkoutBooking, setCheckoutBooking] = useState<BookingResponse | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [form] = Form.useForm();

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

  useEffect(() => {
    loadBookings();
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

  // 🎯 下雨 / 人工退費處理
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

  const submitForm = async (values: any) => {
    try {
      const payload = {
        ...values,
        startTime: values.startTime ? values.startTime.toISOString() : null,
        endTime: values.endTime ? values.endTime.toISOString() : null,
      };

      if (editing) {
        await adminApi.updateBooking(editing.id, payload);
        message.success('更新預約成功');
      } else {
        await adminApi.createBooking(payload);
        message.success('建立預約成功');
      }
      setIsFormOpen(false);
      await loadBookings();
    } catch (err) {
      message.error('儲存預約失敗');
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
          {/* 🎯 1. 未結帳（CONFIRMED）：顯示【結帳】按鈕 */}
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

          {/* 🎯 2. 已結帳（COMPLETED）：顯示【已結帳】標籤與【退費】按鈕 */}
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

          {/* 🎯 3. 已退款（REFUNDED）：顯示【已退款】標籤 */}
          {record.status === 'REFUNDED' && <Tag color="volcano">已退款</Tag>}

          <Button type="link" onClick={() => setDetailBooking(record)}>
            詳細
          </Button>
          <Button type="link" onClick={() => openEdit(record)}>編輯</Button>

          {/* 僅有未結帳與未處理的狀態可執行取消預約 */}
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
          <Form.Item name="userId" label="使用者 ID" rules={[{ required: true, message: '請輸入使用者 ID' }]}>
            <InputNumber style={{ width: '100%' }} min={1} placeholder="請輸入使用者 ID" />
          </Form.Item>
          <Form.Item name="courtId" label="球場 ID" rules={[{ required: true, message: '請輸入球場 ID' }]}>
            <InputNumber style={{ width: '100%' }} min={1} placeholder="請輸入球場 ID" />
          </Form.Item>
          <Form.Item name="startTime" label="開始時間" rules={[{ required: true, message: '請選擇開始時間' }]}>
            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
          </Form.Item>
          <Form.Item name="endTime" label="結束時間" rules={[{ required: true, message: '請選擇結束時間' }]}>
            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
          </Form.Item>
          <Form.Item name="totalFee" label="費用" rules={[{ required: true, message: '請輸入費用' }]}>
            <InputNumber style={{ width: '100%' }} min={0} prefix="NT$" placeholder="請輸入總費用" />
          </Form.Item>
          <Form.Item name="status" label="狀態" initialValue="CONFIRMED">
            <Select>
              <Select.Option value="CONFIRMED">已預約 (CONFIRMED)</Select.Option>
              <Select.Option value="COMPLETED">已結帳 (COMPLETED)</Select.Option>
              <Select.Option value="REFUNDED">已退款 (REFUNDED)</Select.Option>
              <Select.Option value="CANCELLED">已取消 (CANCELLED)</Select.Option>
            </Select>
          </Form.Item>
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
