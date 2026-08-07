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
  Tooltip,
} from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  DownloadOutlined,
  ReloadOutlined,
  TrophyOutlined,
  PayCircleOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 交易紀錄型別定義
interface TransactionRecord {
  id: string;
  bookingId: number;
  userName: string;
  courtName: string;
  amount: number;
  paymentMethod: 'LINE_PAY' | 'CREDIT_CARD' | 'CASH';
  status: 'SUCCESS' | 'REFUNDED' | 'FAILED';
  createdAt: string;
}

// 財務統計資料型別
interface FinancialSummary {
  totalRevenue: number;
  revenueGrowth: number; // 百分比
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

  // 假數據狀態（實務上需改為 call API）
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 128500,
    revenueGrowth: 12.5,
    totalRefunds: 3200,
    completedBookingsCount: 256,
    averageOrderValue: 502,
  });

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // 模擬載入資料
  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // TODO: 替換為實際 API，例如：await adminApi.getFinancialReport(dateRange[0], dateRange[1])
      await new Promise((resolve) => setTimeout(resolve, 600));

      // 模擬交易紀錄
      const mockTransactions: TransactionRecord[] = [
        {
          id: 'TXN-20260807-01',
          bookingId: 108,
          userName: '張先生',
          courtName: '第 A 球場 (室內)',
          amount: 800,
          paymentMethod: 'LINE_PAY',
          status: 'SUCCESS',
          createdAt: '2026-08-07 14:30:00',
        },
        {
          id: 'TXN-20260807-02',
          bookingId: 107,
          userName: '李小姐',
          courtName: '第 B 球場 (室外)',
          amount: 500,
          paymentMethod: 'CREDIT_CARD',
          status: 'SUCCESS',
          createdAt: '2026-08-07 11:15:00',
        },
        {
          id: 'TXN-20260806-05',
          bookingId: 99,
          userName: '王教練',
          courtName: '第 A 球場 (室內)',
          amount: 1600,
          paymentMethod: 'LINE_PAY',
          status: 'REFUNDED',
          createdAt: '2026-08-06 18:00:00',
        },
        {
          id: 'TXN-20260805-03',
          bookingId: 92,
          userName: '陳隊長',
          courtName: '風興網球場',
          amount: 1200,
          paymentMethod: 'CASH',
          status: 'SUCCESS',
          createdAt: '2026-08-05 09:20:00',
        },
      ];

      setTransactions(mockTransactions);
    } catch (error) {
      message.error('載入財務報表失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange, paymentFilter]);

  // 匯出 CSV 報表
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      message.warning('無資料可供匯出');
      return;
    }

    const headers = ['交易單號', '預約編號', '消費者', '球場', '金額', '支付方式', '狀態', '交易時間'];
    const rows = transactions.map((t) => [
      t.id,
      t.bookingId,
      t.userName,
      t.courtName,
      t.amount,
      t.paymentMethod,
      t.status,
      t.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `財務報表_${dayjs().format('YYYYMMDD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success('已開始下載財務報表 CSV');
  };

  // 表格欄位定義
  const columns = [
    {
      title: '交易單號',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Text copyable>{text}</Text>,
    },
    {
      title: '預約編號',
      dataIndex: 'bookingId',
      key: 'bookingId',
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: '消費者',
      dataIndex: 'userName',
      key: 'userName',
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
      title: '金額',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: TransactionRecord) => (
        <Text style={{ color: record.status === 'REFUNDED' ? '#ff4d4f' : '#3f8600' }} strong>
          {record.status === 'REFUNDED' ? `-NT$ ${amount}` : `NT$ ${amount}`}
        </Text>
      ),
      sorter: (a: TransactionRecord, b: TransactionRecord) => a.amount - b.amount,
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => {
        const methodMap: Record<string, { label: string; color: string }> = {
          LINE_PAY: { label: 'LINE Pay', color: 'green' },
          CREDIT_CARD: { label: '信用卡', color: 'blue' },
          CASH: { label: '現場現金', color: 'orange' },
        };
        const target = methodMap[method] || { label: method, color: 'default' };
        return <Tag color={target.color}>{target.label}</Tag>;
      },
    },
    {
      title: '交易狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          SUCCESS: { label: '交易成功', color: 'success' },
          REFUNDED: { label: '已退款', color: 'error' },
          FAILED: { label: '交易失敗', color: 'default' },
        };
        const target = statusMap[status] || { label: status, color: 'default' };
        return <Tag color={target.color}>{target.label}</Tag>;
      },
    },
    {
      title: '交易時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a: TransactionRecord, b: TransactionRecord) =>
        dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 標題與操作區 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>
            <DollarOutlined /> 財務報表與營收分析
          </Title>
          <Text type="secondary">監控系統總收入、退款紀錄與交易明細</Text>
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
            匯出 CSV
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        {/* 核心財務統計卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="總營業額 (Gross Revenue)"
                value={summary.totalRevenue}
                precision={0}
                prefix="NT$"
                valueStyle={{ color: '#3f8600' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  較上期{' '}
                  <Text type={summary.revenueGrowth >= 0 ? 'success' : 'danger'}>
                    {summary.revenueGrowth >= 0 ? <RiseOutlined /> : <FallOutlined />}{' '}
                    {Math.abs(summary.revenueGrowth)}%
                  </Text>
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="已完成預約筆數"
                value={summary.completedBookingsCount}
                suffix="筆"
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  平均客單價：NT$ {summary.averageOrderValue}
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="退款總額 (Total Refunds)"
                value={summary.totalRefunds}
                precision={0}
                prefix="NT$"
                valueStyle={{ color: '#cf1322' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  包含用戶取消與管理員人工退款
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="淨收益 (Net Revenue)"
                value={summary.totalRevenue - summary.totalRefunds}
                precision={0}
                prefix="NT$"
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  實際扣除退款後進帳金額
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 交易明細清單 */}
        <Card
          title={
            <Space>
              <PayCircleOutlined />
              <span>交易與報銷明細</span>
            </Space>
          }
          extra={
            <Space>
              <Text type="secondary">支付方式篩選：</Text>
              <Select
                defaultValue="ALL"
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
            dataSource={
              paymentFilter === 'ALL'
                ? transactions
                : transactions.filter((t) => t.paymentMethod === paymentFilter)
            }
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>
      </Spin>
    </div>
  );
};
