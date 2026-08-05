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
  Form,
  Input,
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  DeleteOutlined,
  PlusOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { User } from '../types';
import { adminApi } from '../api/adminApi';
import { userApi } from '../api/userApi';
import { formatDate } from '../utils/formatters';

const { Title, Text } = Typography;

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAllUsers();
      setUsers(data);
    } catch (err) {
      message.error('載入使用者清單失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (values: { username: string; email: string; password: string }) => {
    try {
      await adminApi.createUser(values);
      message.success('使用者建立成功');
      form.resetFields();
      setIsModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || '建立使用者失敗');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await userApi.deleteUser(id);
      message.success('使用者已刪除');
      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (err) {
      message.error('刪除使用者失敗，請確認權限');
    }
  };

  const isAdmin = (user: User) => user.roles?.some((r) => r.name === 'ROLE_ADMIN');

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '使用者',
      key: 'user',
      render: (_: any, record: User) => (
        <Space>
          <UserOutlined />
          <Space direction="vertical" size={0}>
            <Text strong>{record.username}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '角色',
      key: 'roles',
      render: (_: any, record: User) => (
        <Space>
          {record.roles?.map((role) => (
            <Tag
              key={role.id}
              color={role.name === 'ROLE_ADMIN' ? 'red' : 'blue'}
              icon={role.name === 'ROLE_ADMIN' ? <SafetyOutlined /> : undefined}
            >
              {role.name === 'ROLE_ADMIN' ? '管理員' : '一般會員'}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 120,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '啟用中' : '已停用'}
        </Tag>
      ),
    },
    {
      title: '建立時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: User) => (
        <Space>
          <Button type="link" onClick={() => message.info(`使用者 ${record.username}`)}>
            詳細
          </Button>
          {!isAdmin(record) && (
            <Popconfirm
              title="確定要刪除此使用者？"
              onConfirm={() => handleDelete(record.id)}
              okText="確認"
              cancelText="取消"
            >
              <Button danger size="small" icon={<DeleteOutlined />}>
                刪除
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
            <TeamOutlined /> 使用者管理
          </Title>
          <Text type="secondary">管理員可以建立、檢視與刪除一般會員帳號</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          新增使用者
        </Button>
      </div>

      <Spin spinning={loading} size="large">
        <Table columns={columns} dataSource={users} rowKey="id" pagination={{ pageSize: 10 }} />
      </Spin>

      <Modal title="建立一般使用者" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreateUser} preserve={false}>
          <Form.Item
            label="使用者名稱"
            name="username"
            rules={[{ required: true, message: '請輸入使用者名稱' }]}
          >
            <Input placeholder="例如：newuser" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email', message: '請輸入有效 Email' }]}
          >
            <Input placeholder="example@domain.com" />
          </Form.Item>
          <Form.Item
            label="密碼"
            name="password"
            rules={[{ required: true, min: 6, message: '密碼至少 6 個字元' }]}
          >
            <Input.Password placeholder="輸入密碼" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                建立
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
