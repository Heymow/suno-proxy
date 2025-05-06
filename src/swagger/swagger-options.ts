export const options = {
    customCss: `
      .swagger-ui .topbar-wrapper {
        display: flex;
        align-items: center;
        min-height: 60px;
        gap: 0;
      }
      .swagger-ui .topbar-wrapper a.link {
        margin-right: 0 !important;
        display: flex;
        align-items: center;
        position: relative;
      }
      .swagger-ui .topbar-wrapper svg,
      .swagger-ui .topbar-wrapper span {
        display: none !important;
      }
      .swagger-ui .topbar-wrapper a.link::before {
        content: "";
        display: inline-block;
        background: url('/public/suno-proxy.png') no-repeat center/contain;
        width: 40px;
        height: 40px;
        vertical-align: middle;
      }
      .swagger-ui .topbar-wrapper a.link::after {
        content: "Suno Proxy";
        font-size: 1.3rem;
        font-weight: bold;
        color: #fff;
        letter-spacing: 1px;
        margin-left: 12px;
        display: inline-block;
        vertical-align: middle;
      }
      .swagger-ui .topbar-wrapper a.link img {
        display: none !important;
      }
      .swagger-ui .topbar { 
        background-color: #3153A1; 
        min-height: 60px;
      }
    `,
    customSiteTitle: 'Suno Proxy',
    customfavIcon: '/public/favicon.ico',
};