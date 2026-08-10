import React, { useState, useEffect } from 'react';
import {
  Modal,
  Row,
  Col,
  Card,
  Typography,
  Radio,
  InputNumber,
  Button,
  Divider,
  Form,
  Select,
  message,
  Descriptions,
} from 'antd';
import {
  CreditCardOutlined,
  DollarOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { BookingResponse } from '../types';
import { adminApi } from '../api/adminApi';

const { Title, Text } = Typography;

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  bookingData: BookingResponse | null;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  open,
  onClose,
  bookingData,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT_CARD' | 'LINE_PAY'>('CASH');
  const [cashReceived, setCashReceived] = useState<number | null>(null);
  const [invoiceType, setInvoiceType] = useState<'PERSONAL' | 'COMPANY'>('PERSONAL');
  const [submitting, setSubmitting] = useState(false);

  // 🎯 1. 當開啟 Modal 或 bookingData 變更時，自動預設實收現金等於應收總金額
  useEffect(() => {
    if (open && bookingData) {
      setCashReceived(bookingData.totalFee || 0);
    }
  }, [open, bookingData]);

  if (!bookingData) return null;

  const totalFee = bookingData.totalFee || 0;
  // 找零計算：若 cashReceived 為 null 則以 totalFee 計算
  const actualCashReceived = cashReceived !== null ? cashReceived : totalFee;
  const changeAmount = Math.max(0, actualCashReceived - totalFee);

  // 🎯 2. 結帳提交與寫入流水帳邏輯
  const handleCheckout = async () => {
    // 若 cashReceived 為 null，安全預設代入 totalFee
    const currentCash = cashReceived !== null ? cashReceived : totalFee;

    if (paymentMethod === 'CASH' && currentCash < totalFee) {
      message.error('收取現金金額不足！');
      return;
    }

    setSubmitting(true);
    try {
      // 🎯 正式呼叫後端 API 寫入財務流水帳
      await adminApi.checkoutBooking(bookingData.id, {
        amount: totalFee,
        paymentMethod,
        invoiceType,
      });

      message.success(`預約單 #${bookingData.id} 結帳成功，已寫入財務流水帳！`);
      onSuccess(); // 重新整理預約清單
      onClose();   // 關閉 Modal
    } catch (err) {
      message.error('結帳失敗，請確認網路連線或後端狀態');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={<Title level={3} style={{ margin: 0 }}>櫃檯現場收銀結帳</Title>}
      open={open}
      onCancel={onClose}
      width={850}
      footer={null}
      destroyOnClose
    >
      <Row gutter={[24, 24]}>
        {/* 左側：預約單消費明細 */}
        <Col span={12}>
          <Card title="預約與消費明細" size="small" style={{ height: '100%', background: '#fafafa' }}>
            <Descriptions column={1} size="middle" bordered>
              <Descriptions.Item label="預約編號">
                <Text strong>#{bookingData.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="預約客戶">{bookingData.username}</Descriptions.Item>
              <Descriptions.Item label="球場項目">{bookingData.courtName}</Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0 }}>應收總金額：</Title>
              <Title level={2} style={{ margin: 0, color: '#1677ff' }}>
                NT$ {totalFee}
              </Title>
            </div>
          </Card>
        </Col>

        {/* 右側：支付方式與收銀面板 */}
        <Col span={12}>
          <Form layout="vertical">
            <Form.Item label={<Text strong>選擇支付方式</Text>}>
              <Radio.Group
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                buttonStyle="solid"
                style={{ width: '100%' }}
              >
                <Radio.Button value="CASH" style={{ width: '33.3%', textAlign: 'center' }}>
                  <DollarOutlined /> 現金
                </Radio.Button>
                <Radio.Button value="CREDIT_CARD" style={{ width: '33.3%', textAlign: 'center' }}>
                  <CreditCardOutlined /> 刷卡
                </Radio.Button>
                <Radio.Button value="LINE_PAY" style={{ width: '33.3%', textAlign: 'center' }}>
                  <QrcodeOutlined /> LINE Pay
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            {paymentMethod === 'CASH' && (
              <Card size="small" style={{ background: '#e6f4ff', marginBottom: 16 }}>
                <Row align="middle" gutter={8}>
                  <Col span={12}>
                    <Text>實收現金：</Text>
                    <InputNumber
                      prefix="NT$"
                      style={{ width: '100%', marginTop: 4 }}
                      value={cashReceived}
                      onChange={(val) => setCashReceived(val)}
                      min={0}
                    />
                  </Col>
                  <Col span={12} style={{ textAlign: 'right' }}>
                    <Text>找零金額：</Text>
                    <Title level={3} style={{ margin: 0, color: changeAmount >= 0 ? '#52c41a' : '#ff4d4f' }}>
                      NT$ {changeAmount}
                    </Title>
                  </Col>
                </Row>
              </Card>
            )}

            <Form.Item label={<Text strong>發票設定</Text>}>
              <Select
                value={invoiceType}
                onChange={(val) => setInvoiceType(val)}
                options={[
                  { value: 'PERSONAL', label: '個人雲端發票 / 會員載具' },
                  { value: 'COMPANY', label: '公司統編發票 (三聯式)' },
                ]}
              />
            </Form.Item>

            <Divider />

            <div style={{ textAlign: 'right' }}>
              <Button size="large" onClick={onClose} style={{ marginRight: 8 }}>
                取消
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                loading={submitting}
                onClick={handleCheckout}
              >
                完成結帳 (NT$ {totalFee})
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Modal>
  );
};
