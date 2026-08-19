const fs = require('fs');

let page = fs.readFileSync('src/app/melly/page.tsx', 'utf8');

// Update to use apiFetch correctly instead of just timeout mock
page = page.replace(
  `  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    setLogs(prev => [...prev, { sender: 'operator', text: input, time: new Date().toLocaleTimeString() }]);
    setInput('');
    setLoading(true);
    
    // Simulate AI Router delay
    setTimeout(() => {
      setLogs(prev => [...prev, { 
        sender: 'melly', 
        text: 'The AI Router module and API provider integrations are not yet configured for this node. The external Secure Gateway will be established in a future upgrade phase.', 
        time: new Date().toLocaleTimeString() 
      }]);
      setLoading(false);
    }, 1500);
  };`,
  `  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMessage = input;
    setLogs(prev => [...prev, { sender: 'operator', text: userMessage, time: new Date().toLocaleTimeString() }]);
    setInput('');
    setLoading(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || null;
      
      const response = await fetch((process.env.NEXT_PUBLIC_GATEWAY_URL || '') + '/api/v1/melly/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': \`Bearer \${token}\` } : {})
        },
        body: JSON.stringify({ message: userMessage })
      });
      
      if (!response.ok) {
        let errorMsg = 'Unknown Gateway Error';
        if (response.status === 401) errorMsg = 'Authentication Failed / Missing valid session.';
        if (response.status === 403) errorMsg = 'Authorization Failed / Owner access required.';
        if (response.status === 429) errorMsg = 'Rate Limit Reached.';
        if (response.status >= 500) errorMsg = 'Gateway Unavailable / Server Error.';
        
        try {
          const errData = await response.json();
          if (errData.error) errorMsg += \` (\${errData.error})\`;
        } catch (e) {}
        
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      setLogs(prev => [...prev, { 
        sender: 'melly', 
        text: data.reply || '[Gateway Error: No reply field]', 
        time: new Date().toLocaleTimeString() 
      }]);
    } catch (err: any) {
      setLogs(prev => [...prev, { 
        sender: 'system', 
        text: err.message || 'Connection failed. Verify Gateway configuration.', 
        time: new Date().toLocaleTimeString() 
      }]);
    } finally {
      setLoading(false);
    }
  };`
);

page = page.replace(
  `import { useRouter } from 'next/navigation';`,
  `import { useRouter } from 'next/navigation';\nimport { apiFetch } from '@/src/lib/api';`
);

fs.writeFileSync('src/app/melly/page.tsx', page);

console.log('src/app/melly/page.tsx updated');
