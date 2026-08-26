const fs = require('fs');
const glob = require('glob');

const files = glob.sync('c:/Users/aj386/Desktop/Movie Ticket Booking/quickshow/client/src/pages/admin/**/*.jsx');
files.push('c:/Users/aj386/Desktop/Movie Ticket Booking/quickshow/client/src/components/admin/AdminLayout.jsx');
files.push('c:/Users/aj386/Desktop/Movie Ticket Booking/quickshow/client/src/components/admin/SeatLayoutEditor.jsx');

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace card backgrounds
  content = content.replace(/bg-\[\#141414\]/g, 'bg-[#0f172a]');
  
  // Replace deep backgrounds
  content = content.replace(/bg-\[\#0a0a0a\]/g, 'bg-[#09090b]');
  
  // Replace border colors (only if not already /50 or something)
  content = content.replace(/border-slate-800(?![\/])/g, 'border-slate-800/50');
  
  // Update border radius
  content = content.replace(/rounded-2xl/g, 'rounded-xl');
  
  // Update table hovers
  content = content.replace(/hover:bg-\[\#0a0a0a\](\/80)?/g, 'hover:bg-slate-800/30');
  content = content.replace(/hover:bg-\[\#141414\]/g, 'hover:bg-slate-800/30');

  // Update Recharts grid color
  content = content.replace(/stroke="#F1F5F9"/g, 'stroke="#1e293b"');
  
  // Update primary button backgrounds
  content = content.replace(/bg-primary(?![A-Za-z0-9\/\-])/g, 'bg-red-600');
  
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
});
