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
  Switch,
  Select,
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

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

  // 新增使用者
  const handleCreateUser = async (values: { username: string; email: string; password: string }) => {
    try {
      await adminApi.createUser(values);
      message.success('使用者建立成功');
      createForm.resetFields();
      setIsCreateModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || '建立使用者失敗');
    }
  };

  // 開啟編輯視窗
  const openEditModal = (record: User) => {
    setEditingUser(record);
    editForm.setFieldsValue({
      username: record.username,
      email: record.email,
      enabled: record.enabled ?? true,
      roles: record.roles?.map((r) => r.name) || ['ROLE_USER'],
    });
    setIsEditModalOpen(true);
  };

  // 送出編輯使用者
  const handleUpdateUser = async (values: any) => {
    if (!editingUser) return;
    try {
      await adminApi.updateUser(editingUser.id, values);
      message.success('使用者資料更新成功');
      setIsEditModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || '更新使用者失敗');
    }
  };

  // 刪除使用者
  const handleDelete = async (id: number) => {
    try {
      await userApi.deleteUser(id);
      message.success('使用者已刪除');
      await loadUsers();
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
              key={role.id || role.name}
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
      width: 200,
      render: (_: any, record: User) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            編輯
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
          <Text type="secondary">管理員可以新增、檢視、編輯與刪除使用者帳號</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
          新增使用者
        </Button>
      </div>

      <Spin spinning={loading} size="large">
        <Table columns={columns} dataSource={users} rowKey="id" pagination={{ pageSize: 10 }} />
      </Spin>

      {/* 新增使用者 Modal */}
      <Modal title="新增一般使用者" open={isCreateModalOpen} onCancel={() => setIsCreateModalOpen(false)} footer={null}>
        <Form form={createForm} layout="vertical" onFinish={handleCreateUser} preserve={false}>
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
              <Button onClick={() => setIsCreateModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                建立
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 編輯使用者 Modal */}
      <Modal
        title={`編輯使用者 - ${editingUser?.username || ''}`}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateUser}>
          <Form.Item
            label="使用者名稱"
            name="username"
            rules={[{ required: true, message: '請輸入使用者名稱' }]}
          >
            <Input placeholder="使用者名稱" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email', message: '請輸入有效 Email' }]}
          >
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item label="帳號啟用狀態" name="enabled" valuePropName="checked">
            <Switch checkedChildren="啟用" unCheckedChildren="停用" />
          </Form.Item>
          <Form.Item label="角色設定" name="roles">
            <Select mode="multiple" placeholder="請選擇角色">
              <Select.Option value="ROLE_USER">一般會員 (ROLE_USER)</Select.Option>
              <Select.Option value="ROLE_ADMIN">管理員 (ROLE_ADMIN)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsEditModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                儲存變更
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};