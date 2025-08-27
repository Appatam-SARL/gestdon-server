interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  contributor: {
    name: string;
    email: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };
  subscription: {
    packageName: string;
    startDate: string;
    endDate: string;
    duration: string;
    isFreeTrial: boolean;
  };
  billing: {
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    paymentStatus: string;
  };
  company: {
    name: string;
    logo: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
}

export function getInvoiceTemplate(data: InvoiceData): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${data.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            min-height: 100vh;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(108, 43, 217, 0.1);
            overflow: hidden;
        }
        
        .invoice-header {
            background: linear-gradient(135deg, #6c2bd9 0%, oklch(0.577 0.245 27.325) 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .invoice-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .company-logo {
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            backdrop-filter: blur(10px);
        }
        
        .invoice-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .invoice-subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            padding: 40px;
            background: #f8f9fa;
        }
        
        .detail-section {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            border-left: 4px solid #6c2bd9;
        }
        
        .detail-section h3 {
            color: #6c2bd9;
            font-size: 1.2rem;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .detail-section h3::before {
            content: '✦';
            color: oklch(0.577 0.245 27.325);
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .detail-item:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            font-weight: 600;
            color: #555;
        }
        
        .detail-value {
            color: #333;
            font-weight: 500;
        }
        
        .subscription-details {
            padding: 40px;
            background: white;
        }
        
        .subscription-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            padding: 30px;
            border: 2px solid transparent;
            background-clip: padding-box;
            position: relative;
            overflow: hidden;
        }
        
        .subscription-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #6c2bd9, oklch(0.577 0.245 27.325), green);
        }
        
        .package-name {
            font-size: 1.8rem;
            font-weight: 700;
            color: #6c2bd9;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .subscription-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .info-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        
        .info-label {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-value {
            font-size: 1.1rem;
            font-weight: 600;
            color: #333;
        }
        
        .billing-summary {
            background: linear-gradient(135deg, #6c2bd9 0%, oklch(0.577 0.245 27.325) 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin: 20px 0;
        }
        
        .billing-title {
            text-align: center;
            font-size: 1.5rem;
            margin-bottom: 25px;
            font-weight: 600;
        }
        
        .billing-items {
            display: grid;
            gap: 15px;
        }
        
        .billing-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        
        .billing-item:last-child {
            border-bottom: none;
            border-top: 2px solid rgba(255,255,255,0.3);
            font-weight: 700;
            font-size: 1.2rem;
        }
        
        .total-amount {
            font-size: 2rem;
            font-weight: 700;
            text-align: center;
            margin-top: 20px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .payment-status {
            text-align: center;
            margin-top: 20px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 25px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 0.9rem;
        }
        
        .status-paid {
            background: green;
            color: white;
        }
        
        .status-pending {
            background: #ffc107;
            color: #333;
        }
        
        .status-failed {
            background: #dc3545;
            color: white;
        }
        
        .invoice-footer {
            background: #2c3e50;
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .footer-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .footer-section h4 {
            color: #6c2bd9;
            margin-bottom: 10px;
            font-size: 1.1rem;
        }
        
        .footer-section p {
            color: #bdc3c7;
            line-height: 1.6;
        }
        
        .footer-bottom {
            border-top: 1px solid #34495e;
            padding-top: 20px;
            color: #95a5a6;
            font-size: 0.9rem;
        }
        
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 8rem;
            color: rgba(108, 43, 217, 0.03);
            font-weight: 900;
            pointer-events: none;
            z-index: 1;
        }
        
        @media print {
            body { background: white; }
            .invoice-container { 
                margin: 0; 
                box-shadow: none; 
                border-radius: 0; 
            }
            .watermark { display: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="watermark">CONTRIB</div>
        
        <div class="invoice-header">
            <div class="company-logo">C</div>
            <h1 class="invoice-title">FACTURE</h1>
            <p class="invoice-subtitle">${data.invoiceNumber}</p>
        </div>
        
        <div class="invoice-details">
            <div class="detail-section">
                <h3>Informations Client</h3>
                <div class="detail-item">
                    <span class="detail-label">Nom :</span>
                    <span class="detail-value">${data.contributor.name}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email :</span>
                    <span class="detail-value">${data.contributor.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Adresse :</span>
                    <span class="detail-value">${
                      data.contributor.address.street
                    }</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Ville :</span>
                    <span class="detail-value">${
                      data.contributor.address.city
                    }, ${data.contributor.address.postalCode}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Pays :</span>
                    <span class="detail-value">${
                      data.contributor.address.country
                    }</span>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Détails de la Facture</h3>
                <div class="detail-item">
                    <span class="detail-label">Numéro :</span>
                    <span class="detail-value">${data.invoiceNumber}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Date :</span>
                    <span class="detail-value">${data.invoiceDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Échéance :</span>
                    <span class="detail-value">${data.dueDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Statut :</span>
                    <span class="detail-value">${
                      data.billing.paymentStatus
                    }</span>
                </div>
            </div>
        </div>
        
        <div class="subscription-details">
            <div class="subscription-card">
                <h2 class="package-name">${data.subscription.packageName}</h2>
                
                <div class="subscription-info">
                    <div class="info-item">
                        <div class="info-label">Date de début</div>
                        <div class="info-value">${
                          data.subscription.startDate
                        }</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Date de fin</div>
                        <div class="info-value">${
                          data.subscription.endDate
                        }</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Durée</div>
                        <div class="info-value">${
                          data.subscription.duration
                        }</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Type</div>
                        <div class="info-value">${
                          data.subscription.isFreeTrial
                            ? 'Essai Gratuit'
                            : 'Abonnement Payant'
                        }</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="billing-summary">
            <h3 class="billing-title">Résumé de Facturation</h3>
            
            <div class="billing-items">
                <div class="billing-item">
                    <span>Sous-total</span>
                    <span>${data.billing.subtotal.toFixed(2)} ${
    data.billing.currency
  }</span>
                </div>
                <div class="billing-item">
                    <span>TVA (20%)</span>
                    <span>${data.billing.tax.toFixed(2)} ${
    data.billing.currency
  }</span>
                </div>
                <div class="billing-item">
                    <span>Total</span>
                    <span>${data.billing.total.toFixed(2)} ${
    data.billing.currency
  }</span>
                </div>
            </div>
            
            <div class="total-amount">
                ${data.billing.total.toFixed(2)} ${data.billing.currency}
            </div>
            
            <div class="payment-status">
                <span class="status-badge status-${data.billing.paymentStatus.toLowerCase()}">
                    ${data.billing.paymentStatus}
                </span>
            </div>
        </div>
        
        <div class="invoice-footer">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>Contrib</h4>
                    <p>${data.company.address}</p>
                    <p>Tél: ${data.company.phone}</p>
                </div>
                <div class="footer-section">
                    <h4>Contact</h4>
                    <p>Email: ${data.company.email}</p>
                    <p>Web: ${data.company.website}</p>
                </div>
                <div class="footer-section">
                    <h4>Support</h4>
                    <p>Assistance technique disponible 24/7</p>
                    <p>Documentation en ligne</p>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>Merci de votre confiance ! Cette facture a été générée automatiquement.</p>
                <p>© ${new Date().getFullYear()} Contrib. Tous droits réservés.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}
