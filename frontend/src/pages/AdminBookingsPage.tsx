import { useState, useEffect } from 'react';
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
} from 'antd';
import {
  CalendarOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { BookingResponse } from '../types';
import { adminApi } from '../api/adminApi';
import {
  formatDateTime,
  formatDate,
  formatTime,
  calculateDuration,
  bookingStatusLabels,
  bookingStatusColors,
} from '../utils/formatters';

const { Title, Text } = Typography;

export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailBooking, setDetailBooking] = useState<BookingResponse | null>(null);

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

  const handleCancel = async (id: number) => {
    try {
      await adminApi.cancelBooking(id);
      message.success('已取消該筆預約');
      await loadBookings();
    } catch (err) {
      message.error('取消預約失敗，請確認權限');
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
      render: (_, record: BookingResponse) => (
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
      width: 180,
      render: (_: any, record: BookingResponse) => (
        <Space size="small" wrap>
          <Button type="link" onClick={() => setDetailBooking(record)}>
            詳細
          </Button>
          {record.status !== 'CANCELLED' && (
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
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          <CalendarOutlined /> 全部預約
        </Title>
        <Text type="secondary">管理員可檢視系統內所有使用者的球場預約紀錄</Text>
      </div>

      <Spin spinning={loading} size="large">
        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Spin>

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
            <Descriptions.Item label="報到狀態">{detailBooking.checkInStatus}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};
