/**
 * Payment Gateway SDK
 * Embeddable checkout widget
 */

(function (window) {
  'use strict';

  class PaymentGateway {
    constructor(options) {
      this.options = {
        key: options.key,
        orderId: options.orderId,
        amount: options.amount,
        onSuccess: options.onSuccess || function() {},
        onFailure: options.onFailure || function() {},
        onClose: options.onClose || function() {},
        checkoutUrl: options.checkoutUrl || 'http://localhost:3001'
      };

      this.modal = null;
      this.iframe = null;
      this.handleMessage = this.handleMessage.bind(this);
    }

    open() {
      this.createModal();
      window.addEventListener('message', this.handleMessage);
    }

    createModal() {
      // Create overlay
      this.modal = document.createElement('div');
      this.modal.id = 'payment-gateway-modal';
      this.modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
      `;

      // Create iframe container
      const container = document.createElement('div');
      container.style.cssText = `
        position: relative;
        width: 90%;
        max-width: 500px;
        height: 600px;
        background: white;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      `;

      // Create close button
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '&times;';
      closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        border: none;
        background: white;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        z-index: 1;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      `;
      closeButton.onclick = () => this.close();

      // Create iframe
      this.iframe = document.createElement('iframe');
      const checkoutUrl = `${this.options.checkoutUrl}?` + 
        `key=${encodeURIComponent(this.options.key)}` +
        `&orderId=${encodeURIComponent(this.options.orderId)}` +
        `&amount=${encodeURIComponent(this.options.amount)}`;
      
      this.iframe.src = checkoutUrl;
      this.iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
      `;

      container.appendChild(closeButton);
      container.appendChild(this.iframe);
      this.modal.appendChild(container);
      document.body.appendChild(this.modal);
    }

    handleMessage(event) {
      // In production, verify event.origin
      if (event.data && event.data.type) {
        switch (event.data.type) {
          case 'payment_success':
            this.options.onSuccess({
              paymentId: event.data.paymentId,
              orderId: event.data.orderId,
              status: event.data.status
            });
            this.close();
            break;
          
          case 'payment_failed':
            this.options.onFailure({
              error: event.data.error
            });
            this.close();
            break;
          
          case 'close_modal':
            this.close();
            break;
        }
      }
    }

    close() {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      window.removeEventListener('message', this.handleMessage);
      this.options.onClose();
    }
  }

  // Expose to window
  window.PaymentGateway = PaymentGateway;

})(window);
