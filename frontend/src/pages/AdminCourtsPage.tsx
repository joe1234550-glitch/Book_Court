import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Popconfirm,
} from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  TrophyOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { Court, CourtType, CourtStatus } from '../types';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { adminCourtApi } from '../api/adminCourtApi'; // 👈 1. 改為引用獨立的 adminCourtApi
import {
  courtTypeLabels,
  courtStatusLabels,
  courtStatusColors,
} from '../utils/formatters';

const { Title, Text } = Typography;
const { TextArea } = Input;

// 👈 同時提供具名匯出 (export const)
export const AdminCourtsPage: React.FC = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  // 👈 2. 管理員載入「所有」球場 (包含維修與關閉)
  const loadCourts = async () => {
    setLoading(true);
    try {
      const data = await adminCourtApi.getAllCourts();
      setCourts(data);
    } catch (err: any) {
      message.error(err.response?.data?.message || '載入球場清單失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const doInit = async () => {
      try {
        const resp = await api.get('/auth/refresh/cookie', { withCredentials: true });
        const data = resp.data;
        if (data && data.accessToken) {
          useAuthStore.getState().login({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            userId: data.userId,
            username: data.username,
            roles: data.roles,
          });
        }
      } catch (err) {
        // Refresh token 失敗時靜態忽略
      }
      await loadCourts();
    };

    doInit();
  }, []);

  // 👈 3. 新增球場改用 adminCourtApi
  const handleCreate = async (values: {
    name: string;
    type: CourtType;
    status: CourtStatus;
    description: string;
    hourlyRate: number;
  }) => {
    setSubmitLoading(true);
    try {
      await adminCourtApi.createCourt(values);
      message.success('球場新增成功');
      setIsModalOpen(false);
      form.resetFields();
      await loadCourts();
    } catch (err: any) {
      message.error(err.response?.data?.message || '新增失敗，請檢查名稱是否重複');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 👈 4. 更新狀態改用 adminCourtApi
  const handleStatusChange = async (id: number, newStatus: CourtStatus) => {
    try {
      await adminCourtApi.updateCourtStatus(id, newStatus);
      message.success('狀態更新成功');
      await loadCourts();
    } catch (err: any) {
      message.error(err.response?.data?.message || '狀態更新失敗');
    }
  };

  // 👈 5. 刪除球場改用 adminCourtApi
  const handleDelete = async (id: number) => {
    try {
      await adminCourtApi.deleteCourt(id);
      message.success('已刪除球場');
      await loadCourts();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.response?.data || '刪除失敗，該球場可能已有預約紀錄');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '球場名稱',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <TrophyOutlined style={{ color: '#1890ff' }} />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: '類型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: CourtType) => <Tag color="blue">{courtTypeLabels[type]}</Tag>,
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status: CourtStatus, record: Court) => (
        <Space>
          <Tag color={courtStatusColors[status]}>
            {courtStatusLabels[status]}
          </Tag>
          <Select
            size="small"
            style={{ width: 100 }}
            value={status}
            onChange={(value: CourtStatus) => handleStatusChange(record.id, value)}
            options={[
              { value: 'AVAILABLE', label: '開放中' },
              { value: 'MAINTENANCE', label: '維修中' },
              { value: 'CLOSED', label: '已關閉' },
            ]}
          />
        </Space>
      ),
    },
    {
      title: '每小時費用',
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      width: 140,
      render: (rate: number) => (
        <Tag color="green">
          <DollarOutlined /> NT${rate}/小時
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => desc || <Text type="secondary">無</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Court) => (
        <Popconfirm
          title="確定要刪除此球場嗎？"
          description="若已有預約紀錄將無法刪除。"
          onConfirm={() => handleDelete(record.id)}
          okText="確定"
          cancelText="取消"
        >
          <Button danger size="small">
            刪除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>
            <SettingOutlined /> 球場管理
          </Title>
          <Text type="secondary">管理所有球場的資料與營運狀態</Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          新增球場
        </Button>
      </div>

      <Spin spinning={loading} size="large">
        <Table
          columns={columns}
          dataSource={courts}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Spin>

      <Modal
        title={<Space><PlusOutlined /> 新增球場</Space>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} preserve={false}>
          <Form.Item
            name="name"
            label="球場名稱"
            rules={[{ required: true, message: '請輸入球場名稱' }]}
          >
            <Input placeholder="例如：第一球場 (硬地)" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="type"
            label="球場類型"
            rules={[{ required: true, message: '請選擇球場類型' }]}
          >
            <Select
              placeholder="請選擇球場類型"
              options={[
                { value: 'HARD', label: '硬地' },
                { value: 'CLAY', label: '紅土' },
                { value: 'GRASS', label: '草地' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="營運狀態"
            initialValue="AVAILABLE"
            rules={[{ required: true, message: '請選擇狀態' }]}
          >
            <Select
              options={[
                { value: 'AVAILABLE', label: '開放中' },
                { value: 'MAINTENANCE', label: '維修中' },
                { value: 'CLOSED', label: '已關閉' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="hourlyRate"
            label="每小時費用 (NT$)"
            rules={[{ required: true, message: '請輸入費用' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="例如：300" />
          </Form.Item>

          <Form.Item name="description" label="球場描述">
            <TextArea rows={4} placeholder="輸入球場描述、設備資訊等" maxLength={500} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitLoading}>
                確認新增
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// 👈 保留預設匯出 (export default) 確保 Router 不會報錯
export default AdminCourtsPage;
