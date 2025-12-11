import * as Print from "expo-print";

interface Concepto {
  cantidad?: string;
  descripcion: string;
  total: string;
}

export interface ReciboProps {
  folio: string;
  cuenta: string;
  fechaVencimiento: string;
  atraso: string;
  adeudo?: string; // Nuevo campo para adeudo (opcional, default "0")
  totalAPagar: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  periodoFacturado: string;
  servicio: string;
  conceptos: Concepto[];
  totalConceptos: string;
  codigoUsuario?: string;

  consumos?: number[];
  meses?: string[];

  logoCmasBase64?: string;
  logoLetrasBase64?: string;
  qrUrl?: string;
}

export const generateReciboCMAS = async (props: ReciboProps): Promise<string> => {
  try {
    const {
      folio,
      cuenta,
      fechaVencimiento,
      atraso,
      adeudo = "0",
      totalAPagar,
      nombre,
      direccion,
      ciudad,
      periodoFacturado,
      servicio,
      conceptos,
      totalConceptos,
      codigoUsuario,

      consumos = [14.2, 15.8, 14.5, 16.0, 13.9, 15.3, 14.7, 15.9, 14.1, 15.6, 15.2],
      meses = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV"],

      logoCmasBase64,
      logoLetrasBase64,
      qrUrl,
    } = props;

    // QR
    const payloadForQr = qrUrl
      ? qrUrl
      : `https://pago.cmas.example/pay?cuenta=${encodeURIComponent(
          cuenta
        )}&ref=${encodeURIComponent(codigoUsuario ?? folio)}`;

    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
      payloadForQr
    )}`;

    // Código de barras
    const barcodeSrc = `https://barcodeapi.org/api/128/${encodeURIComponent(
      cuenta
    )}?includetext=false`;

    // Escala gráfica
    const maxValor = Math.max(...consumos, 1);

    const barrasHTML = consumos
      .map((v, i) => {
        const altura = (v / maxValor) * 100;
        return `
        <div style="text-align:center;">
          <div style="height:${altura}%; width:14px; background:#0093D8; border-radius:4px;"></div>
          <div style="font-size:9px; margin-top:4px;">${meses[i] ?? ""}</div>
        </div>`;
      })
      .join("");

    // Saneamiento automático
    const conceptosFinal = [
      ...conceptos,
      { descripcion: "Saneamiento", total: "22.00" },
    ];

    // Calcular servicio de agua para el talón (total - saneamiento)
    const saneamientoMonto = 22.00;
    const totalAPagarNum = parseFloat(totalAPagar);
    const servicioAguaTalon = Math.max(0, totalAPagarNum - saneamientoMonto).toFixed(2);

    const html = `
    <html>
    <head>
      <meta charset="UTF-8"/>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        /* ----------------------------------------------------
           🔧 FIX CROSS-PLATFORM ANDROID / iOS (LAYOUT)
        -----------------------------------------------------*/
        * {
          -webkit-margin-before: 0;
          -webkit-margin-after: 0;
          -webkit-padding-start: 0;
          -webkit-padding-end: 0;
          box-sizing: border-box;
        }

        body, div, span, p, table, td {
          font-smooth: always;
          -webkit-font-smoothing: antialiased;
        }

        html, body {
          width: 760px;
          margin: 0 auto;
          padding: 0;
          zoom: 1; /* evita zoom automático en iOS */
          background:#f0f4f8;
        }

        img {
          image-rendering: crisp-edges;
          -webkit-text-size-adjust: 100%;
          max-width: none !important;
        }

        /* Forzar flex para evitar colapso de grid en iOS */
        .four-cards,
        .chart-wrapper,
        .chart-area,
        .qr-user-container,
        .details-card {
          display: flex !important;
        }

        /* ----------------------------------------------------
           🔠 FIX TIPOGRAFÍA ANDROID / iOS
        -----------------------------------------------------*/
        html, body {
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
          letter-spacing: 0.2px;         /* separación consistente */
          line-height: 1.28;             /* altura uniforme */
          font-kerning: normal;
          font-feature-settings: "kern", "liga", "clig", "calt";
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        *, p, div, span, td, strong {
          letter-spacing: 0.2px;
          line-height: 1.28;
        }

        * {
          -webkit-margin-collapse: separate !important;
        }

        .page {
          transform: scale(1);
          zoom: 1;
          width:760px; 
          margin:18px auto; 
          background:#fff; 
          border-radius:6px;
        }

        /* ---------------------------------------------------- */

        .header {
          background:white;
          padding:10px 20px;
          border-bottom:2px solid #005882;
          display:flex;
          align-items:center;
          gap:10px;
        }

        .header-logos img {
          width:70px;
          height:70px;
          object-fit:contain;
        }

        .header-text {
          flex:1;
          text-align:center;
          font-size:18px;
          font-weight:700;
          color:#005882;
        }

        .body { padding:20px; }

        .four-cards { 
          display:flex !important; 
          flex-direction:row;
          justify-content:flex-start;
          align-items:center; /* ✅ CORREGIDO: era "aling-items" */
          gap: 8px; 
          flex-wrap: nowrap;
        }

        .mini-card {
          background:#ffffff;
          border:1px solid #cde8ff;
          padding:6px 8px;
          border-radius:8px;
          display:flex;
          flex-direction:column;                               
          justify-content: center;
          align-items: center;
          min-width: 90px;
          width: 90px;
          height: 60px;
        }

        .mini-key { 
          font-size:9px; 
          font-weight:700; 
          color:#005882; 
          margin-bottom: 8px;
          text-align: center;
          line-height: 1.2;
        }
        
        .mini-value { 
          font-size:15px; 
          font-weight:bold; 
          color:#005882;
          text-align: center;
          padding: 0 4px;
          word-wrap: break-word;
          line-height: 1.3;
        }

        .qr-user-container { width:160px; flex-direction:column; align-items:center; gap:6px; flex-shrink:0; }
        .qr-box img { width:110px; height:110px; }

        .barcode-under img { width:140px; height:35px; margin-top:4px; }

        .user-data {
          margin-top:10px;
          background:#f7fbff;
          border:1px solid #cde8ff;
          padding:12px;
          border-radius:8px;
          font-size:12px;
          line-height: 1.8;
        }

        .user-data div {
          margin-bottom: 6px;
        }

        .user-data div:last-child {
          margin-bottom: 0;
        }

        .details-card {
          margin-top:18px;
          background:#f7fbff;
          border:1px solid #cde8ff;
          border-radius:8px;
          padding:12px;
          flex:1;
          flex-direction:column;
        }

        .details-table td { padding:4px; font-size:12px; }

        .chart-card {
          background:#f7fbff;
          border:1px solid #cde8ff;
          padding:12px;
          border-radius:8px;
          margin-top:18px;
          width:300px;
        }

        .chart-card-title { font-weight:700; color:#005882; text-align:center; margin-bottom:8px; }

        .chart-wrapper { gap:10px; }

        .scale-left { font-size:10px; color:#005882; flex-direction:column; justify-content:space-between; }

        .chart-area { height:150px; align-items:flex-end; gap:6px; padding-top:50px; }

        .total-box {
          margin-top:20px;
          background:#fff;
          border:1px solid #cde8ff;
          padding:12px;
          border-radius:8px;
          display:flex;
          justify-content:space-between;
          gap:20px;
        }

        .concept-item {
          display:flex;
          justify-content:space-between;
          border-bottom:1px dashed #cfdbe5;
          padding:6px 2px;
          font-size:12px;
        }

        .total-value {
          font-size:28px;
          font-weight:900;
          color:#005882;
          text-align:right;
        }

        .ticket {
          margin-top:40px;
          padding:14px;
          border-top:2px dashed #999;
        }

        .ticket-title {
          text-align:center;
          font-weight:700;
          color:#005882;
          margin-bottom:12px;
        }

        .ticket-section-title {
          margin-bottom:8px;
          font-weight:700;
          color:#005882;
        }

        .ticket-row { font-size:12px; margin-bottom:4px; }

        .barcode img { width:250px; height:40px; margin-top:6px; }

        .left-side { flex:1; max-width:calc(100% - 180px); }
      </style>
    </head>

    <body>
      <div class="page">

        <!-- HEADER -->
        <div class="header">
          <div class="header-logos">
            ${logoCmasBase64 ? `<img src="data:image/png;base64,${logoCmasBase64}" />` : ""}
            ${logoLetrasBase64 ? `<img src="data:image/png;base64,${logoLetrasBase64}" />` : ""}
          </div>

          <div class="header-text">
            Comisión Municipal de Agua Potable y Saneamiento
          </div>
        </div>

        <div class="body">

          <!-- TARJETAS -->
          <div style="display:flex; justify-content:space-between; gap:12px;">
            <div class="left-side">
              <div class="four-cards">
                <div class="mini-card"><div class="mini-key">CUENTA</div><div class="mini-value">${cuenta}</div></div>
                <div class="mini-card"><div class="mini-key">VENCIMIENTO</div><div class="mini-value">${fechaVencimiento}</div></div>
                <div class="mini-card"><div class="mini-key">ATRASO</div><div class="mini-value">${atraso}</div></div>
                <div class="mini-card"><div class="mini-key">ADEUDO</div><div class="mini-value">${adeudo}</div></div>
                <div class="mini-card"><div class="mini-key">TOTAL</div><div class="mini-value">$${totalAPagar}</div></div>
              </div>

              <div class="user-data">
                <div><strong>CLIENTE:</strong> ${nombre}</div>
                <div><strong>DIRECCIÓN:</strong> ${direccion}</div>
                <div><strong>CIUDAD:</strong> ${ciudad}</div>
              </div>
            </div>

            <div class="qr-user-container">
              <div class="qr-box"><img src="${qrSrc}" /></div>

              <div class="barcode-under">
                <img src="${barcodeSrc}" />
              </div>
            </div>
          </div>

          <!-- DETALLES + GRAFICA -->
          <div style="display:flex; gap:20px;">

            <!-- DETALLES -->
            <div class="details-card">
              <div style="font-weight:700;color:#005882;margin-bottom:6px;">DETALLES DEL SERVICIO</div>
              <table class="details-table">
                <tr><td><strong>Periodo facturado:</strong></td><td>${periodoFacturado}</td></tr>
                <tr><td><strong>Servicio:</strong></td><td>${servicio}</td></tr>
                <tr><td><strong>Tipo de usuario:</strong></td><td>Dom Urbano Medio</td></tr>
                <tr><td><strong>Medidor:</strong></td><td>12345678</td></tr>
                <tr><td><strong>Cálculo:</strong></td><td>Promedio</td></tr>
                <tr><td><strong>Avisos importantes:</strong></td><td>Gracias por su pago</td></tr>
              </table>
            </div>

            <!-- GRAFICA -->
            <div class="chart-card">
              <div class="chart-card-title">HISTORIAL DE CONSUMO</div>

              <div class="chart-wrapper">

                <div class="scale-left">
                  ${Array.from({ length: 11 }, (_, i) => (15.0 - i * 0.5).toFixed(1)).join("<br>")}
                </div>

                <div class="chart-area">
                  ${barrasHTML}
                </div>

              </div>
            </div>

          </div>

          <!-- TOTAL Y CONCEPTOS -->
          <div class="total-box">
            <div style="flex:1;">
              ${conceptosFinal
                .map(
                  c => `
                  <div class="concept-item">
                    <div>${c.descripcion}</div>
                    <div>$${c.total}</div>
                  </div>`
                )
                .join("")}
            </div>

            <div>
              <div style="font-weight:700;color:#005882;">TOTAL A PAGAR</div>
              <div class="total-value">$${totalConceptos}</div>
            </div>
          </div>

          <!-- TALÓN DEL USUARIO -->
          <div class="ticket">

            <div class="ticket-title">
              Comisión Municipal de Agua Potable y Saneamiento
            </div>

            <div style="display:flex; justify-content:space-between; gap:20px;">
              
              <div style="flex:1;">
                <div class="ticket-section-title">DATOS</div>

                <div class="ticket-row"><strong>Cuenta:</strong> ${cuenta}</div>
                <div class="ticket-row"><strong>Cliente:</strong> ${nombre}</div>
                <div class="ticket-row"><strong>Domicilio:</strong> ${direccion}</div>
                <div class="ticket-row"><strong>Ciudad:</strong> ${ciudad}</div>
              </div>

              <div style="text-align:right;">
                <div style="margin-bottom:12px; font-weight:700; color:#005882;">ADEUDO</div>
                
                <div class="ticket-row">Servicio de agua: ${servicioAguaTalon}</div>
                <div class="ticket-row">Saneamiento: $22.00</div>

                <div class="ticket-row" style="font-weight:700; font-size:16px; margin-top:8px;">
                  TOTAL A PAGAR: ${parseFloat(totalConceptos).toFixed(2)}
                </div>

                <div class="barcode"><img src="${barcodeSrc}" /></div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </body>
    </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    return uri;

  } catch (error) {
    console.error("Error printing:", error);
    throw error;
  }
};