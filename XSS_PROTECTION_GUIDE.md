# XSS Protection Implementation Guide

## 🛡️ Backend Protection (Node.js/Express)

### Security Packages Installed:
1. **helmet** - Sets secure HTTP headers
2. **express-rate-limit** - Prevents brute force attacks
3. **express-mongo-sanitize** - Prevents NoSQL injection
4. **hpp** - Prevents HTTP Parameter Pollution

### Features Implemented:

#### 1. HTTP Security Headers (Helmet)
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

#### 2. Rate Limiting
- General API: 100 requests/15 minutes per IP
- Auth endpoints: 5 attempts/15 minutes per IP

#### 3. Input Sanitization
- Automatic HTML escaping
- Script tag removal
- Event handler removal
- JavaScript protocol blocking

#### 4. Request Size Limits
- JSON/URL-encoded body: 10MB max

---

## 🎨 Frontend Protection (React)

### Utilities Available:

#### 1. `escapeHtml(text)`
Escape HTML special characters:
```javascript
import { escapeHtml } from '@/utils/sanitize';

const userInput = '<script>alert("XSS")</script>';
const safe = escapeHtml(userInput);
// Output: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
```

#### 2. `stripHtml(html)`
Remove all HTML tags:
```javascript
import { stripHtml } from '@/utils/sanitize';

const html = '<p>Hello <script>alert("XSS")</script></p>';
const text = stripHtml(html);
// Output: Hello
```

#### 3. `sanitizeUrl(url)`
Validate and sanitize URLs:
```javascript
import { sanitizeUrl } from '@/utils/sanitize';

const badUrl = 'javascript:alert("XSS")';
const safe = sanitizeUrl(badUrl);
// Output: #
```

#### 4. `createSafeHtml(html)`
Remove dangerous HTML while keeping safe tags:
```javascript
import { createSafeHtml } from '@/utils/sanitize';

const userHtml = '<p>Hello</p><script>alert("XSS")</script>';
const safe = createSafeHtml(userHtml);
// Output: <p>Hello</p>
```

#### 5. `SafeHtml` Component
React component to safely render HTML:
```jsx
import { SafeHtml } from '@/utils/sanitize';

function MyComponent({ userContent }) {
  return (
    <SafeHtml 
      html={userContent} 
      className="user-content"
    />
  );
}
```

---

## 📝 Usage Examples

### Example 1: Display User Comment
```jsx
import { stripHtml } from '@/utils/sanitize';

function Comment({ text }) {
  return <p>{stripHtml(text)}</p>;
}
```

### Example 2: Render User Profile (with some HTML)
```jsx
import { SafeHtml } from '@/utils/sanitize';

function UserProfile({ bio }) {
  return (
    <div className="bio">
      <SafeHtml html={bio} />
    </div>
  );
}
```

### Example 3: Validate Form Input
```jsx
import { sanitizeInput } from '@/utils/sanitize';

function handleSubmit(e) {
  e.preventDefault();
  
  const cleanName = sanitizeInput(formData.name);
  const cleanEmail = sanitizeInput(formData.email);
  
  // Send to backend
  await api.post('/users', { name: cleanName, email: cleanEmail });
}
```

### Example 4: Safe Link Rendering
```jsx
import { sanitizeUrl } from '@/utils/sanitize';

function UserLink({ url, text }) {
  return (
    <a href={sanitizeUrl(url)} target="_blank" rel="noopener noreferrer">
      {text}
    </a>
  );
}
```

---

## ⚠️ Best Practices

### DO:
✅ Always sanitize user input before displaying
✅ Use `stripHtml()` for plain text display
✅ Use `SafeHtml` component for rich text
✅ Validate URLs before using in `href` or `src`
✅ Set `rel="noopener noreferrer"` on external links

### DON'T:
❌ Never use `dangerouslySetInnerHTML` directly without sanitization
❌ Don't trust any user input
❌ Don't disable CSP headers without good reason
❌ Don't store passwords or sensitive data in localStorage

---

## 🔍 Testing XSS Protection

### Test Cases:

1. **Script Injection**
   ```
   Input: <script>alert('XSS')</script>
   Expected: Script should be escaped/removed
   ```

2. **Event Handler**
   ```
   Input: <img src=x onerror="alert('XSS')">
   Expected: onerror attribute should be removed
   ```

3. **JavaScript Protocol**
   ```
   Input: <a href="javascript:alert('XSS')">Click</a>
   Expected: href should be replaced with #
   ```

4. **HTML Injection**
   ```
   Input: <iframe src="evil.com"></iframe>
   Expected: iframe should be removed
   ```

---

## 🚀 Production Recommendations

For production, consider these additional libraries:

1. **DOMPurify** - More robust HTML sanitization
   ```bash
   npm install dompurify
   ```

2. **validator.js** - Advanced input validation
   ```bash
   npm install validator
   ```

3. **Content Security Policy (CSP) Reporter**
   - Set up CSP reporting endpoint
   - Monitor CSP violations

---

## 📊 Security Headers Currently Set

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=15552000; includeSubDomains
```

---

## 🔧 Configuration

### Adjust Rate Limits (server.js)
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Change time window
  max: 100, // Change max requests
  message: 'Custom message',
});
```

### Customize CSP (server.js)
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://trusted-cdn.com"],
      // Add more directives
    },
  },
}));
```

---

## 📞 Support

If you encounter issues or need to whitelist specific domains/scripts, update the CSP directives in `server.js`.
