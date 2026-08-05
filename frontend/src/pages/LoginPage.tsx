import { Form, Input, Button, Card, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(values);
      login({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        userId: response.userId,
        username: response.username,
        roles: response.roles,
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('帳號或密碼錯誤，請重新輸入');
      } else if (err.response?.status === 403) {
        setError('此帳號已被停用，請聯絡管理員');
      } else {
        setError('登入失敗，請稍後再試');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: 420, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48 }}>🎾</div>
          <Title level={2} style={{ margin: '8px 0' }}>球場預約系統</Title>
          <Text type="secondary">登入您的帳號以繼續使用</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form name="login" onFinish={onFinish} size="large" layout="vertical">
          <Form.Item
            name="username"
            label="使用者名稱"
            rules={[{ required: true, message: '請輸入使用者名稱' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="請輸入使用者名稱" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密碼"
            rules={[{ required: true, message: '請輸入密碼' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="請輸入密碼" />
          </Form.Item>

          <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登入
              </Button>
            </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary">還沒有帳號？</Text>
        </Divider>

        <Link to="/register" style={{ display: 'block', textAlign: 'center' }}>
          <Button block>立即註冊</Button>
        </Link>

        <div style={{ marginTop: 24, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <strong>測試帳號：</strong>
            <br />
            一般使用者：testuser / password123
            <br />
            管理員：adminuser / password123
          </Text>
        </div>
      </Card>
    </div>
  );
};
