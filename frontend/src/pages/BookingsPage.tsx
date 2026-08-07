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
  Empty,
  Tabs,
  Card,
  Descriptions,
  Tooltip,
  Alert,
} from 'antd';
import {
  CalendarOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import dayjs from 'dayjs';
import { BookingResponse } from '../types';
import { bookingApi } from '../api/bookingApi';
import {
  formatDateTime,
  formatDate,
  formatTime,
  calculateDuration,
  checkInStatusLabels,
  checkInStatusColors,
  bookingStatusLabels,
  bookingStatusColors,
} from '../utils/formatters';

const { Title, Text } = Typography;

export const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrcodeBooking, setQrcodeBooking] = useState<BookingResponse | null>(null);
  const [detailBooking, setDetailBooking] = useState<BookingResponse | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingApi.getMyBookings();
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

  const handleCheckIn = async (id: number) => {
    try {
      await bookingApi.checkInBooking(id);
      message.success('報到成功！');
      await loadBookings();
    } catch (err: any) {
      message.error(err.response?.data?.message || '報到失敗，請確認預約狀態');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await bookingApi.cancelBooking(id);
      message.success('預約已取消');
      await loadBookings();
    } catch (err: any) {
      message.error(err.response?.data?.message || '取消預約失敗');
    }
  };

  // 判斷是否可取消：非已取消、尚未報到、且尚未過期
  const canCancel = (booking: BookingResponse) => {
    const isCheckedIn = booking.checkInStatus === 'CHECKED_IN';
    return (
      booking.status !== 'CANCELLED' &&
      !isCheckedIn &&
      dayjs().isBefore(dayjs(booking.startTime))
    );
  };

  // 判斷是否可報到：已確認狀態、尚未報到、於開始前30分鐘至結束時間內
  const canCheckIn = (booking: BookingResponse) => {
    const isCheckedIn = booking.checkInStatus === 'CHECKED_IN';
    return (
      booking.status === 'CONFIRMED' &&
      !isCheckedIn &&
      dayjs().isAfter(dayjs(booking.startTime).subtract(30, 'minute')) &&
      dayjs().isBefore(dayjs(booking.endTime))
    );
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
      title: '預約日期',
      dataIndex: 'startTime',
      key: 'date',
      render: (start: string) => formatDate(start),
      sorter: (a: BookingResponse, b: BookingResponse) =>
        dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf(),
    },
    {
      title: '時間',
      key: 'time',
      render: (_: any, record: BookingResponse) => (
        <Space direction="vertical" size={0}>
          <Text>
            {formatTime(record.startTime)} - {formatTime(record.endTime)}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {calculateDuration(record.startTime, record.endTime)}
          </Text>
        </Space>
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
      title: '報到狀態',
      dataIndex: 'checkInStatus',
      key: 'checkInStatus',
      render: (status: string, record: BookingResponse) => (
        <Space direction="vertical" size={0}>
          <Tag color={checkInStatusColors[status as keyof typeof checkInStatusColors] || 'default'}>
            {checkInStatusLabels[status as keyof typeof checkInStatusLabels] || status || '未報到'}
          </Tag>
          {record.checkInTime && (
            <Tooltip title="實際報到時間">
              <Text type="secondary" style={{ fontSize: 11 }}>
                {formatTime(record.checkInTime)}
              </Text>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_: any, record: BookingResponse) => (
        <Space size="small" wrap>
          <Tooltip title="預約細節">
            <Button
              size="small"
              icon={<CalendarOutlined />}
              onClick={() => setDetailBooking(record)}
            >
              細節
            </Button>
          </Tooltip>
          {record.status !== 'CANCELLED' && (
            <Tooltip title="顯示QR Code報到">
              <Button
                size="small"
                type="primary"
                icon={<QrcodeOutlined />}
                onClick={() => setQrcodeBooking(record)}
                ghost
              >
                QR Code
              </Button>
            </Tooltip>
          )}
          {canCheckIn(record) && (
            <Tooltip title="現場立即報到">
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleCheckIn(record.id)}
              >
                報到
              </Button>
            </Tooltip>
          )}
          {canCancel(record) && (
            <Popconfirm
              title="確定要取消此預約嗎？"
              description="已取消的預約無法復原"
              onConfirm={() => handleCancel(record.id)}
              okText="確認取消"
              cancelText="返回"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<CloseCircleOutlined />}>
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const filterUpcoming = (b: BookingResponse) =>
    b.status !== 'CANCELLED' && dayjs(b.endTime).isAfter(dayjs());

  const filterPast = (b: BookingResponse) =>
    b.status === 'CANCELLED' || dayjs(b.endTime).isBefore(dayjs());

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          <CalendarOutlined /> 我的預約
        </Title>
        <Text type="secondary">查看與管理您的球場預約紀錄</Text>
      </div>

      <Spin spinning={loading} size="large">
        <Tabs
          defaultActiveKey="all"
          items={[
            {
              key: 'all',
              label: `全部 (${bookings.length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={bookings}
                  rowKey="id"
                  locale={{ emptyText: <Empty description="尚無預約紀錄" /> }}
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                />
              ),
            },
            {
              key: 'upcoming',
              label: `即將到來 (${bookings.filter(filterUpcoming).length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={bookings.filter(filterUpcoming)}
                  rowKey="id"
                  locale={{ emptyText: <Empty description="沒有即將到來的預約" /> }}
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                />
              ),
            },
            {
              key: 'history',
              label: `歷史紀錄 (${bookings.filter(filterPast).length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={bookings.filter(filterPast)}
                  rowKey="id"
                  locale={{ emptyText: <Empty description="尚無歷史預約" /> }}
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                />
              ),
            },
          ]}
        />
      </Spin>

      {/* 預約細節 Modal */}
      <Modal
        title="預約細節"
        open={!!detailBooking}
        onCancel={() => setDetailBooking(null)}
        footer={[
          <Button key="close" onClick={() => setDetailBooking(null)}>
            關閉
          </Button>,
        ]}
        width={600}
      >
        {detailBooking && (
          <Card>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="預約編號">#{detailBooking.id}</Descriptions.Item>
              <Descriptions.Item label="建立時間">
                {formatDateTime(detailBooking.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="球場">{detailBooking.courtName}</Descriptions.Item>
              <Descriptions.Item label="預約日期">
                {formatDate(detailBooking.startTime)}
              </Descriptions.Item>
              <Descriptions.Item label="預約時段">
                {formatTime(detailBooking.startTime)} - {formatTime(detailBooking.endTime)}
                <Text type="secondary">
                  {' '}（{calculateDuration(detailBooking.startTime, detailBooking.endTime)}）
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="預約費用">
                <Tag color="green">NT${detailBooking.totalFee}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="預約狀態">
                <Tag color={bookingStatusColors[detailBooking.status] || 'default'}>
                  {bookingStatusLabels[detailBooking.status] || detailBooking.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="報到狀態">
                <Space>
                  <Tag color={checkInStatusColors[detailBooking.checkInStatus as keyof typeof checkInStatusColors] || 'default'}>
                    {checkInStatusLabels[detailBooking.checkInStatus as keyof typeof checkInStatusLabels] || detailBooking.checkInStatus || '未報到'}
                  </Tag>
                  {detailBooking.checkInTime && (
                    <Text type="secondary">
                      （{formatDateTime(detailBooking.checkInTime)}）
                    </Text>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="預約人">{detailBooking.username}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </Modal>

      {/* QR Code Modal */}
      <Modal
        title={
          <Space>
            <QrcodeOutlined />
            <span>預約報到 QR Code</span>
          </Space>
        }
        open={!!qrcodeBooking}
        onCancel={() => setQrcodeBooking(null)}
        footer={[
          <Button key="close" onClick={() => setQrcodeBooking(null)}>
            關閉
          </Button>,
        ]}
        width={420}
        centered
      >
        {qrcodeBooking && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: 24, background: 'white', display: 'inline-block', borderRadius: 8, border: '1px solid #eee' }}>
              <QRCodeSVG
                value={JSON.stringify({
                  bookingId: qrcodeBooking.id,
                  courtId: qrcodeBooking.courtId,
                  userId: qrcodeBooking.userId,
                  startTime: qrcodeBooking.startTime,
                })}
                size={240}
                level="H"
                includeMargin={true}
              />
            </div>
            <div style={{ marginTop: 20, textAlign: 'left' }}>
              <Card size="small" type="inner">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="預約編號">
                    <Text strong>#{qrcodeBooking.id}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="球場">
                    {qrcodeBooking.courtName}
                  </Descriptions.Item>
                  <Descriptions.Item label="日期">
                    {formatDate(qrcodeBooking.startTime)}
                  </Descriptions.Item>
                  <Descriptions.Item label="時間">
                    {formatTime(qrcodeBooking.startTime)} - {formatTime(qrcodeBooking.endTime)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </div>
            <Alert
              style={{ marginTop: 16 }}
              message="使用方式"
              description="請於預約時間前 30 分鐘至球場現場，掃描此 QR Code 或由櫃檯人員協助報到。"
              type="info"
              showIcon
            />
          </div>
        )}
      </Modal>
    </div>
  );
};
