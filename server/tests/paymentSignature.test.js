const crypto = require('crypto');

function generateSignature(orderId, paymentId, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

describe('Razorpay payment signature verification', () => {
  const SECRET = 'test_secret_key_12345';

  test('a correctly generated signature matches itself (genuine payment case)', () => {
    const orderId = 'order_ABC123';
    const paymentId = 'pay_XYZ789';

    const razorpaySignature = generateSignature(orderId, paymentId, SECRET);
    const ourCalculatedSignature = generateSignature(orderId, paymentId, SECRET);

    expect(ourCalculatedSignature).toBe(razorpaySignature);
  });

  test('a tampered order ID produces a different signature (fraud attempt is detected)', () => {
    const originalOrderId = 'order_ABC123';
    const tamperedOrderId = 'order_ABC124';
    const paymentId = 'pay_XYZ789';

    const genuineSignature = generateSignature(originalOrderId, paymentId, SECRET);
    const signatureForTamperedData = generateSignature(tamperedOrderId, paymentId, SECRET);

    expect(signatureForTamperedData).not.toBe(genuineSignature);
  });

  test('using the wrong secret key produces a different signature (stolen-key scenario)', () => {
    const orderId = 'order_ABC123';
    const paymentId = 'pay_XYZ789';
    const wrongSecret = 'wrong_secret_key';

    const genuineSignature = generateSignature(orderId, paymentId, SECRET);
    const signatureWithWrongSecret = generateSignature(orderId, paymentId, wrongSecret);

    expect(signatureWithWrongSecret).not.toBe(genuineSignature);
  });
});