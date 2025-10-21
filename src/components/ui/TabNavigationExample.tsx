import React from 'react'

// Example of using the CSS classes directly for tab navigation
export default function TabNavigationExample() {
  const [activeTab, setActiveTab] = React.useState('tab1')

  return (
    <div className="tab-navigation">
      <button
        onClick={() => setActiveTab('tab1')}
        className={`tab-navigation-item ${
          activeTab === 'tab1' ? 'tab-navigation-item-active' : 'tab-navigation-item-inactive'
        }`}
      >
        <span className="flex-shrink-0">📊</span>
        Tab 1
      </button>
      
      <button
        onClick={() => setActiveTab('tab2')}
        className={`tab-navigation-item ${
          activeTab === 'tab2' ? 'tab-navigation-item-active' : 'tab-navigation-item-inactive'
        }`}
      >
        <span className="flex-shrink-0">⚙️</span>
        Tab 2
      </button>
      
      <button
        onClick={() => setActiveTab('tab3')}
        className={`tab-navigation-item ${
          activeTab === 'tab3' ? 'tab-navigation-item-active' : 'tab-navigation-item-inactive'
        }`}
      >
        <span className="flex-shrink-0">📈</span>
        Tab 3
      </button>
    </div>
  )
}
