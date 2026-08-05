import { Layout, Menu, Button, Dropdown, Avatar, Space, theme } from 'antd';
import {
  HomeOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Header, Content, Footer } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, username, isAdmin, logout, refreshToken } = useAuthStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } finally {
      logout();
      navigate('/login');
    }
  };

  const guestMenu = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">首頁</Link> },
    { key: '/courts', icon: <TrophyOutlined />, label: <Link to="/courts">球場預約</Link> },
  ];

  const userMenu = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">首頁</Link> },
    { key: '/courts', icon: <TrophyOutlined />, label: <Link to="/courts">球場預約</Link> },
    { key: '/bookings', icon: <CalendarOutlined />, label: <Link to="/bookings">我的預約</Link> },
    { key: '/profile', icon: <UserOutlined />, label: <Link to="/profile">個人資料</Link> },
  ];

  const adminMenu = isAdmin()
    ? [
        {
          key: 'admin',
          icon: <SettingOutlined />,
          label: '管理後台',
          children: [
            { key: '/admin/courts', icon: <TrophyOutlined />, label: <Link to="/admin/courts">球場管理</Link> },
            { key: '/admin/bookings', icon: <CalendarOutlined />, label: <Link to="/admin/bookings">預約管理</Link> },
            { key: '/admin/users', icon: <TeamOutlined />, label: <Link to="/admin/users">使用者管理</Link> },
          ],
        },
      ]
    : [];

  const menuItems = isAuthenticated ? [...userMenu, ...adminMenu] : guestMenu;

  const userDropdownMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '個人資料',
        onClick: () => navigate('/profile'),
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '登出',
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: '#001529',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              color: 'white',
              fontSize: 20,
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
            }}
          >
            🎾 球場預約系統
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ flex: 1, minWidth: 0, background: 'transparent' }}
          />
        </div>
        <Space>
          {isAuthenticated ? (
            <Dropdown menu={userDropdownMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer', color: 'white' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{username}</span>
              </Space>
            </Dropdown>
          ) : (
            <>
              <Button type="primary" ghost onClick={() => navigate('/login')}>
                登入
              </Button>
              <Button type="primary" onClick={() => navigate('/register')}>
                註冊
              </Button>
            </>
          )}
        </Space>
      </Header>
      <Content style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <div
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            padding: 24,
            minHeight: 'calc(100vh - 180px)',
          }}
        >
          {children}
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        球場預約系統 ©{new Date().getFullYear()} - Powered by React + Spring Boot
      </Footer>
    </Layout>
  );
};
