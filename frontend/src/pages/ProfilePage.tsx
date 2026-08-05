import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Avatar,
  Descriptions,
  Row,
  Col,
  Statistic,
  message,
  Space,
  Tag,
  Spin,
  Divider,
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  TrophyOutlined,
  DollarOutlined,
  EditOutlined,
  SaveOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../api/userApi';
import { bookingApi } from '../api/bookingApi';
import { User, BookingResponse } from '../types';
import { formatDate } from '../utils/formatters';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { userId, username, roles, isAdmin } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (userId) {
        const [userData, bookingsData] = await Promise.all([
          userApi.getUserById(userId),
          bookingApi.getMyBookings().catch(() => []),
        ]);
        setUser(userData);
        setBookings(bookingsData);
        form.setFieldsValue({
          email: userData.email,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values: { email: string; name?: string }) => {
    if (!userId) return;
    setSubmitLoading(true);
    try {
      const updated = await userApi.updateUser(userId, {
        email: values.email,
        name: values.name,
      });
      setUser(updated);
      message.success('資料更新成功');
      setEditMode(false);
    } catch (err: any) {
      message.error(err.response?.data || '更新失敗');
    } finally {
      setSubmitLoading(false);
    }
  };

  const totalSpent = bookings
    .filter((b) => b.status !== 'CANCELLED')
    .reduce((sum, b) => sum + (b.totalFee || 0), 0);

  const completedBookings = bookings.filter(
    (b) =>
      b.status !== 'CANCELLED' && dayjs(b.endTime).isBefore(dayjs())
  ).length;

  const upcomingBookings = bookings.filter(
    (b) => b.status !== 'CANCELLED' && dayjs(b.endTime).isAfter(dayjs())
  ).length;

  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED').length;

  return (
    <Spin spinning={loading} size="large">
      <div>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            <UserOutlined /> 個人資料
          </Title>
          <Text type="secondary">管理您的帳號資訊與預約統計</Text>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Card style={{ textAlign: 'center', borderRadius: 12 }}>
              <Avatar
                size={100}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff', marginBottom: 16 }}
              />
              <Title level={3} style={{ marginBottom: 4 }}>
                {user?.username || username}
              </Title>
              <Space direction="vertical" size={8} style={{ marginBottom: 16 }}>
                {user?.email && <Text type="secondary">{user.email}</Text>}
                <Space>
                  {isAdmin() && (
                    <Tag color="red" icon={<SafetyOutlined />}>
                      管理員
                    </Tag>
                  )}
                  <Tag color="blue">一般會員</Tag>
                </Space>
              </Space>
              <Divider />
              <Descriptions column={1} size="small" style={{ textAlign: 'left' }}>
                <Descriptions.Item label="會員編號">#{user?.id || userId}</Descriptions.Item>
                <Descriptions.Item label="註冊日期">
                  {user?.createdAt ? formatDate(user.createdAt) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="帳號狀態">
                  {user?.enabled ? (
                    <Tag color="green">啟用中</Tag>
                  ) : (
                    <Tag color="red">已停用</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={12} sm={6}>
                <Card style={{ borderRadius: 8 }}>
                  <Statistic
                    title={
                      <Space>
                        <CalendarOutlined style={{ color: '#1890ff' }} />
                        預約總數
                      </Space>
                    }
                    value={bookings.length}
                    suffix="場"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card style={{ borderRadius: 8 }}>
                  <Statistic
                    title={
                      <Space>
                        <TrophyOutlined style={{ color: '#52c41a' }} />
                        已完成
                      </Space>
                    }
                    value={completedBookings}
                    suffix="場"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card style={{ borderRadius: 8 }}>
                  <Statistic
                    title={
                      <Space>
                        <CalendarOutlined style={{ color: '#faad14' }} />
                        待使用
                      </Space>
                    }
                    value={upcomingBookings}
                    suffix="場"
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card style={{ borderRadius: 8 }}>
                  <Statistic
                    title={
                      <Space>
                        <DollarOutlined style={{ color: '#eb2f96' }} />
                        累計消費
                      </Space>
                    }
                    value={totalSpent}
                    prefix="NT$"
                    valueStyle={{ color: '#eb2f96' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card
              title={
                <Space>
                  <EditOutlined />
                  <span>基本資料設定</span>
                </Space>
              }
              extra={
                !editMode ? (
                  <Button
                    type="primary"
                    ghost
                    icon={<EditOutlined />}
                    onClick={() => setEditMode(true)}
                  >
                    編輯
                  </Button>
                ) : null
              }
              style={{ borderRadius: 12 }}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdate}
                disabled={!editMode}
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="使用者名稱">
                      <Input value={user?.username || username || ''} disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: '請輸入 Email' },
                        { type: 'email', message: '請輸入有效的 Email' },
                      ]}
                    >
                      <Input placeholder="請輸入 Email" />
                    </Form.Item>
                  </Col>
                </Row>

                {editMode && (
                  <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                    <Space>
                      <Button onClick={() => setEditMode(false)}>取消</Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={submitLoading}
                      >
                        儲存變更
                      </Button>
                    </Space>
                  </Form.Item>
                )}
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
};
