import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Statistic,
  Space,
  List,
  Tag,
  Avatar,
} from 'antd';
import {
  TrophyOutlined,
  CalendarOutlined,
  UserOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  StarOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Court, BookingResponse } from '../types';
import { courtApi } from '../api/courtApi';
import { bookingApi } from '../api/bookingApi';
import { useAuthStore } from '../store/authStore';
import {
  courtTypeLabels,
  formatTime,
  calculateDuration,
} from '../utils/formatters';

const { Title, Paragraph, Text } = Typography;

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuthStore();
  const [courts, setCourts] = useState<Court[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingResponse[]>([]);

  useEffect(() => {
    loadCourts();
    if (isAuthenticated) {
      loadUpcomingBookings();
    }
  }, [isAuthenticated]);

  const loadCourts = async () => {
    try {
      const data = await courtApi.getAvailableCourts();
      setCourts(data.slice(0, 6));
    } catch {
      // ignore
    }
  };

  const loadUpcomingBookings = async () => {
    try {
      const bookings = await bookingApi.getMyBookings();
      const now = dayjs();
      const upcoming = bookings
        .filter(
          (b) => b.status !== 'CANCELLED' && dayjs(b.endTime).isAfter(now)
        )
        .sort(
          (a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
        )
        .slice(0, 5);
      setUpcomingBookings(upcoming);
    } catch {
      // ignore
    }
  };

  const features = [
    {
      icon: <TrophyOutlined style={{ color: '#1890ff', fontSize: 36 }} />,
      title: '多樣化球場',
      desc: '硬地、草地、紅土三種專業級球場，符合各種打法需求',
    },
    {
      icon: <CalendarOutlined style={{ color: '#52c41a', fontSize: 36 }} />,
      title: '線上預約',
      desc: '24小時線上預約系統，即時查詢空檔，快速完成預約',
    },
    {
      icon: <ClockCircleOutlined style={{ color: '#faad14', fontSize: 36 }} />,
      title: '彈性時段',
      desc: '早上6點至晚上10點，每小時為單位自由選擇預約時段',
    },
    {
      icon: <StarOutlined style={{ color: '#eb2f96', fontSize: 36 }} />,
      title: 'QR Code報到',
      desc: '預約成功後產生QR Code，現場掃描即可快速報到',
    },
  ];

  return (
    <div>
      <Card
        style={{
          marginBottom: 32,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 16,
          border: 'none',
        }}
        bodyStyle={{ padding: 48 }}
      >
        <Row gutter={32} align="middle">
          <Col xs={24} md={14}>
            <Title
              level={1}
              style={{ color: 'white', marginBottom: 16, fontSize: 42 }}
            >
              🎾 歡迎來到球場預約系統
            </Title>
            <Paragraph
              style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, marginBottom: 24 }}
            >
              最專業的網球場預約平台，提供多樣化球場與便捷的線上預約服務，
              讓您隨時隨地都能預約喜愛的打球時光！
            </Paragraph>
            <Space wrap>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/courts')}
                style={{
                  height: 48,
                  paddingLeft: 32,
                  paddingRight: 32,
                  fontSize: 16,
                  borderRadius: 8,
                }}
              >
                立即預約球場 <ArrowRightOutlined />
              </Button>
              {!isAuthenticated && (
                <Button
                  size="large"
                  ghost
                  onClick={() => navigate('/register')}
                  style={{
                    height: 48,
                    paddingLeft: 32,
                    paddingRight: 32,
                    fontSize: 16,
                    borderRadius: 8,
                    color: 'white',
                    borderColor: 'white',
                  }}
                >
                  免費註冊
                </Button>
              )}
            </Space>
          </Col>
          <Col xs={24} md={10}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card style={{ textAlign: 'center', borderRadius: 12 }}>
                  <Statistic
                    title={<Text style={{ color: '#666' }}>球場數量</Text>}
                    value={courts.length || 4}
                    suffix="座"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card style={{ textAlign: 'center', borderRadius: 12 }}>
                  <Statistic
                    title={<Text style={{ color: '#666' }}>營運時段</Text>}
                    value="8-22"
                    suffix="點"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card style={{ textAlign: 'center', borderRadius: 12 }}>
                  <Statistic
                    title={<Text style={{ color: '#666' }}>球場類型</Text>}
                    value={3}
                    suffix="種"
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card style={{ textAlign: 'center', borderRadius: 12 }}>
                  <Statistic
                    title={<Text style={{ color: '#666' }}>我的預約</Text>}
                    value={upcomingBookings.length}
                    suffix="場"
                    valueStyle={{ color: '#eb2f96' }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {isAuthenticated && upcomingBookings.length > 0 && (
        <Card
          title={
            <Space>
              <CalendarOutlined style={{ color: '#1890ff' }} />
              <span>即將到來的預約</span>
            </Space>
          }
          extra={
            <Button type="link" onClick={() => navigate('/bookings')}>
              查看全部 <ArrowRightOutlined />
            </Button>
          }
          style={{ marginBottom: 32, borderRadius: 12 }}
        >
          <List
            dataSource={upcomingBookings}
            renderItem={(booking) => (
              <List.Item
                actions={[
                  <Button
                    key="view"
                    size="small"
                    type="primary"
                    ghost
                    onClick={() => navigate('/bookings')}
                  >
                    查看
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<TrophyOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                  title={
                    <Space>
                      <Text strong>{booking.courtName}</Text>
                      <Tag color="blue">
                        {dayjs(booking.startTime).format('MM-DD ddd')}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space>
                      <Text>
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </Text>
                      <Text type="secondary">
                        （{calculateDuration(booking.startTime, booking.endTime)}）
                      </Text>
                      <Tag color="green">NT${booking.totalFee}</Tag>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {features.map((feature, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card
              hoverable
              style={{ textAlign: 'center', height: '100%', borderRadius: 12 }}
              bodyStyle={{ padding: 32 }}
            >
              <div style={{ marginBottom: 16 }}>{feature.icon}</div>
              <Title level={4} style={{ marginBottom: 8 }}>
                {feature.title}
              </Title>
              <Text type="secondary">{feature.desc}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={
          <Space>
            <TrophyOutlined style={{ color: '#1890ff' }} />
            <span>熱門球場</span>
          </Space>
        }
        extra={
          <Button type="link" onClick={() => navigate('/courts')}>
            查看全部球場 <ArrowRightOutlined />
          </Button>
        }
        style={{ borderRadius: 12 }}
      >
        {courts.length > 0 ? (
          <Row gutter={[16, 16]}>
            {courts.map((court) => (
              <Col xs={24} sm={12} lg={8} key={court.id}>
                <Card
                  hoverable
                  onClick={() => navigate('/courts')}
                  style={{ borderRadius: 8 }}
                  actions={[
                    <Button
                      key="book"
                      type="primary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/courts');
                      }}
                    >
                      預約
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <Avatar
                        icon={<TrophyOutlined />}
                        style={{ backgroundColor: '#1890ff' }}
                        size={48}
                      />
                    }
                    title={
                      <Space>
                        <Text strong>{court.name}</Text>
                        <Tag color="blue">{courtTypeLabels[court.type]}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4} style={{ marginTop: 8 }}>
                        <Tag color="green" style={{ margin: 0 }}>
                          NT${court.hourlyRate}/小時
                        </Tag>
                        <Text
                          type="secondary"
                          ellipsis={{ tooltip: court.description }}
                          style={{ fontSize: 12 }}
                        >
                          {court.description || '專業級網球場'}
                        </Text>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
            請至「球場預約」頁面查看所有開放中的球場
          </div>
        )}
      </Card>
    </div>
  );
};
