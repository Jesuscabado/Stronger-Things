/**
 * Componente reutilizable de pestañas.
 * Uso:
 *   <Tabs tabs={[
 *     { id: "general", label: "General", content: <General /> },
 *     { id: "stats", label: "Stats", content: <Stats /> }
 *   ]} />
 */
import { useState } from "react";

export default function Tabs({ tabs, defaultTab }) {
    const [active, setActive] = useState(defaultTab || tabs[0]?.id);
    const activeTab = tabs.find(t => t.id === active);

    return (
        <div>
            <div className="tabs-nav">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`tab-btn ${active === tab.id ? "tab-btn--active" : ""}`}
                        onClick={() => setActive(tab.id)}
                    >
                        {tab.icon && <span className="tab-icon">{tab.icon}</span>}
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="tab-content">
                {activeTab?.content}
            </div>
        </div>
    );
}
