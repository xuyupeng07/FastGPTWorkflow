export default function TestStyles() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Tailwind CSS 样式测试页面
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold text-blue-600 mb-4">卡片组件</h2>
            <p className="text-gray-600">这是一个测试卡片，用于验证 Tailwind CSS 样式是否正常工作。</p>
            <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
              测试按钮
            </button>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-700 mb-4">成功状态</h2>
            <p className="text-green-600">绿色主题的卡片，测试颜色系统。</p>
            <div className="mt-4 flex space-x-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">标签1</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">标签2</span>
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-purple-700 mb-4">紫色主题</h2>
            <p className="text-purple-600">紫色主题的卡片，测试更多颜色变体。</p>
            <div className="mt-4">
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
              <p className="text-sm text-purple-500 mt-1">进度: 75%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">响应式布局测试</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-red-100 p-4 rounded text-center">
              <div className="text-red-600 font-semibold">小屏幕</div>
              <div className="text-sm text-red-500">1列</div>
            </div>
            <div className="bg-yellow-100 p-4 rounded text-center">
              <div className="text-yellow-600 font-semibold">中等屏幕</div>
              <div className="text-sm text-yellow-500">2列</div>
            </div>
            <div className="bg-blue-100 p-4 rounded text-center">
              <div className="text-blue-600 font-semibold">大屏幕</div>
              <div className="text-sm text-blue-500">4列</div>
            </div>
            <div className="bg-indigo-100 p-4 rounded text-center">
              <div className="text-indigo-600 font-semibold">超大屏幕</div>
              <div className="text-sm text-indigo-500">4列</div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}