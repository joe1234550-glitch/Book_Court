import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Button,
  Select,
  Tag,
  Space,
  Typography,
  Spin,
  message,
} from 'antd';
import {
  DollarOutlined,
  DownloadOutlined,
  ReloadOutlined,
  TrophyOutlined,
  PayCircleOutlined,
  CheckCircleOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

import { adminFinancialReportApi } from '../api/adminFinancialReportApi';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 對應後端格式化後的 Transaction 結構
interface FormattedTransaction {
  id: string; // 後端轉為 "TXN-1" 格式
  bookingId: number;
  userName: string;
  courtName: string;
  amount: number;
  paymentMethod: string;
  status: 'SUCCESS' | 'REFUNDED' | string;
  createdAt: string;
}

// 對應後端 summary 統計欄位
interface FinancialSummary {
  totalRevenue: number;
  revenueGrowth: number;
  totalRefunds: number;
  completedBookingsCount: number;
  averageOrderValue: number;
}

export const FinancialReportPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalRefunds: 0,
    completedBookingsCount: 0,
    averageOrderValue: 0,
  });

  const [transactions, setTransactions] = useState<FormattedTransaction[]>([]);

  // 載入財務報表資料
  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined;
      const endDate = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined;

      console.log('🚀 [前端] 開始發送財務報表請求：', { startDate, endDate, paymentFilter });

      // 呼叫後端 AdminFinancialController
      const res = await adminFinancialReportApi.getFinancialReport(startDate, endDate, paymentFilter);

      console.log('✅ [前端] 成功取得後端資料：', res);

      // 解構後端 Response 的 summary 與 transactions
      if (res) {
        if (res.summary) {
          setSummary({
            totalRevenue: Number(res.summary.totalRevenue || 0),
            revenueGrowth: Number(res.summary.revenueGrowth || 0),
            totalRefunds: Number(res.summary.totalRefunds || 0),
            completedBookingsCount: Number(res.summary.completedBookingsCount || 0),
            averageOrderValue: Number(res.summary.averageOrderValue || 0),
          });
        }

        if (Array.isArray(res.transactions)) {
          setTransactions(res.transactions);
        } else {
          setTransactions([]);
        }
      }
    } catch (error: any) {
      console.error('❌ [前端] 財務報表讀取失敗：', error);
      message.error(error.response?.data?.message || '載入財務報表失敗，請確認伺服器連線');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange, paymentFilter]);

  // 匯出 CSV 功能
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      message.warning('當前無交易資料可供匯出');
      return;
    }

    const headers = ['交易單號', '預約單號', '消費者', '球場', '金額', '支付方式', '交易狀態', '交易時間'];
    const rows = transactions.map((t) => [
      t.id,
      t.bookingId,
      t.userName,
      t.courtName,
      t.amount,
      t.paymentMethod,
      t.status,
      t.createdAt ? dayjs(t.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `營收財務報表_${dayjs().format('YYYYMMDD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success('已順利匯出財務報表 CSV');
  };

  // 表格欄位規劃
  const columns = [
    {
      title: '交易流水號',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text copyable strong style={{ color: '#1890ff' }}>{id || '-'}</Text>,
    },
    {
      title: '預約編號',
      dataIndex: 'bookingId',
      key: 'bookingId',
      render: (id: number) => <Text strong>#{id || '-'}</Text>,
    },
    {
      title: '消費者名稱',
      dataIndex: 'userName',
      key: 'userName',
      render: (name: string) => <Text>{name || '會員'}</Text>,
    },
    {
      title: '場地名稱',
      dataIndex: 'courtName',
      key: 'courtName',
      render: (court: string) => (
        <Space>
          <TrophyOutlined style={{ color: '#fa8c16' }} />
          <span>{court || '網球場'}</span>
        </Space>
      ),
    },
    {
      title: '金額',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: FormattedTransaction) => {
        const isRefunded = record.status === 'REFUNDED';
        return (
          <Tag color={isRefunded ? 'volcano' : 'green'} style={{ fontSize: '13px', padding: '2px 8px' }}>
            <DollarOutlined /> {isRefunded ? `- NT$ ${amount}` : `NT$ ${amount}`}
          </Tag>
        );
      },
      sorter: (a: FormattedTransaction, b: FormattedTransaction) => a.amount - b.amount,
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => {
        const methodMap: Record<string, { label: string; color: string }> = {
          LINE_PAY: { label: 'LINE Pay', color: 'green' },
          CREDIT_CARD: { label: '信用卡', color: 'blue' },
          CASH: { label: '現金結帳', color: 'orange' },
        };
        const target = methodMap[method] || { label: method || '未知', color: 'default' };
        return <Tag color={target.color}>{target.label}</Tag>;
      },
    },
    {
      title: '交易狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'SUCCESS') {
          return (
            <Tag icon={<CheckCircleOutlined />} color="success">
              交易成功
            </Tag>
          );
        }
        if (status === 'REFUNDED') {
          return (
            <Tag icon={<RollbackOutlined />} color="error">
              已退款
            </Tag>
          );
        }
        return <Tag>{status}</Tag>;
      },
    },
    {
      title: '結帳 / 交易時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
      sorter: (a: FormattedTransaction, b: FormattedTransaction) =>
        dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 頁頭與控制選單 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>
            <DollarOutlined /> 財務報表與獲利統計
          </Title>
          <Text type="secondary">即時彙總櫃檯結帳與線上支付獲利，追蹤營收與沖銷紀錄</Text>
        </div>
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])}
            allowClear={false}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchFinancialData}>
            重新整理
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportCSV}>
            匯出 CSV 報表
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        {/* 頂部 4 大核心 KPI 統計卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Statistic
                title="總營業額 (Gross Revenue)"
                value={summary.totalRevenue}
                precision={0}
                prefix="NT$"
                valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  結帳累計總進帳金額
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Statistic
                title="已結帳成功筆數"
                value={summary.completedBookingsCount}
                suffix="筆"
                valueStyle={{ fontWeight: 'bold' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  平均單筆交易金額：NT$ {summary.averageOrderValue}
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Statistic
                title="總退款金額 (Total Refunds)"
                value={summary.totalRefunds}
                precision={0}
                prefix="NT$"
                valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  因天候/人工退款之沖銷金額
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Statistic
                title="淨獲利 (Net Revenue)"
                value={summary.totalRevenue - summary.totalRefunds}
                precision={0}
                prefix="NT$"
                valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  扣除退款後的實際淨收益
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 下方交易明細清單 */}
        <Card
          title={
            <Space>
              <PayCircleOutlined />
              <span>交易與獲利流水帳明細</span>
            </Space>
          }
          extra={
            <Space>
              <Text type="secondary">支付方式過濾：</Text>
              <Select
                value={paymentFilter}
                style={{ width: 140 }}
                onChange={(value) => setPaymentFilter(value)}
                options={[
                  { value: 'ALL', label: '全部方式' },
                  { value: 'LINE_PAY', label: 'LINE Pay' },
                  { value: 'CREDIT_CARD', label: '信用卡' },
                  { value: 'CASH', label: '現金' },
                ]}
              />
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={transactions}
            rowKey={(record) => record.id}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>
      </Spin>
    </div>
  );
};
