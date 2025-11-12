import React from 'react';
import Button from './Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You can log the error to an error reporting service here
    this.setState({ error, info });
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught error', error, info);
  }

  handleReload = () => {
    // Reset state and optionally reload the page
    this.setState({ hasError: false, error: null, info: null }, () => {
      // try a soft reload of the app
      window.location.reload();
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-xl w-full bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Có lỗi xảy ra</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Một thành phần đã gặp lỗi. Bạn có thể tải lại trang hoặc liên hệ quản trị viên.</p>
            <div className="text-left text-xs text-gray-500 dark:text-gray-300 mb-4 overflow-auto max-h-40 text-start">
              <pre className="whitespace-pre-wrap">{this.state.error?.toString()}</pre>
            </div>
            <div className="flex justify-center gap-3">
              <Button onClick={this.handleReload}>Tải lại</Button>
              <Button variant="ghost" onClick={() => window.location.href = '/'}>Về trang chủ</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
