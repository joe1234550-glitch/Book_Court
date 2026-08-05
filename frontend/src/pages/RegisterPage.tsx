import { Form, Input, Button, Card, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../api/authApi';

const { Title, Text } = Typography;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: { username: string; email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.register({
        username: values.username,
        email: values.email,
        password: values.password,
      });
      navigate('/login', { state: { message: '註冊成功，請登入' } });
    } catch (err: any) {
      if (err.response?.data) {
        setError(err.response.data || '註冊失敗');
      } else {
        setError('註冊失敗，請稍後再試');
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
          <Title level={2} style={{ margin: '8px 0' }}>加入會員</Title>
          <Text type="secondary">建立您的球場預約帳號</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form name="register" onFinish={onFinish} size="large" layout="vertical">
          <Form.Item
            name="username"
            label="使用者名稱"
            rules={[
              { required: true, message: '請輸入使用者名稱' },
              { min: 3, max: 50, message: '使用者名稱長度需介於 3-50 字元' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="請輸入使用者名稱" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: '請輸入 Email' },
              { type: 'email', message: '請輸入有效的 Email 格式' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="請輸入 Email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密碼"
            rules={[
              { required: true, message: '請輸入密碼' },
              { min: 6, message: '密碼至少 6 個字元以上' },
            ]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="請輸入密碼" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="確認密碼"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: '請確認密碼' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('兩次輸入的密碼不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="請再次輸入密碼" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              註冊
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary">已有帳號？</Text>
        </Divider>

        <Link to="/login" style={{ display: 'block', textAlign: 'center' }}>
          <Button block>返回登入</Button>
        </Link>
      </Card>
    </div>
  );
};
