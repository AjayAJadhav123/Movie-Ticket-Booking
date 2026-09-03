const jwkToPem = require('jwk-to-pem');
const jwk = {
  "use": "sig",
  "kty": "RSA",
  "kid": "ins_3HxowtyVqndfQul0Nv9PY88CEbX",
  "alg": "RS256",
  "n": "0nuaDGg3voofF9v6Ux-z2LVxuWPdTDQpLTybfHDLjjFiyQJbpXyx_uOj-sQonxGP9xFEP64e-DgtzYJAN9Q6VxhndUp_YUcbEDaMXMtrBlV_MSzheSTLPkm-Sp-SBmSgE3HW-1AckrslEgTUaPzESnbgFOMfKe2AV3GWjyWC_WWceMcuJhiwXuV-FiYnRlqRKpO7DPX4R-4_h-g3ELGrv4oeasFuvDlINunc6uTSsB4MeTjY-It60OJigtc3gnYA5_407lEG0zEEjDfPKe5SnlQ9-mK4CdAaELzowhQnKfTEGdi0LY-yKph_7hiJue4S_P1CmMSEWX7Y5aj02i4OxQ",
  "e": "AQAB"
};
const fs = require('fs');
const pem = jwkToPem(jwk);
fs.writeFileSync('jwk.pem', pem);
console.log(pem.replace(/\n/g, '\\n'));
