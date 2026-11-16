/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, MessageSquare, CheckSquare, FileText, BarChart3, BookOpen, Menu, X } from 'lucide-react';

export type ActiveTab = 'chat' | 'revisor' | 'redactor' | 'catalogo' | 'panel';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  sessionConsultasCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, sessionConsultasCount }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'chat' as ActiveTab, label: 'Asistente', icon: MessageSquare },
    { id: 'revisor' as ActiveTab, label: 'Revisor de checklist', icon: CheckSquare },
    { id: 'redactor' as ActiveTab, label: 'Redactor de nota', icon: FileText },
    { id: 'catalogo' as ActiveTab, label: '11 Trámites', icon: BookOpen },
    { id: 'panel' as ActiveTab, label: 'Panel del organismo', icon: BarChart3, badge: 'Demo' }
  ];

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-[#1F3A5F] text-white border-b border-[#2BB5A0]/20 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleTabChange('chat')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2BB5A0] to-[#1F3A5F] flex items-center justify-center shadow-inner border border-[#2BB5A0]/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white font-['Montserrat']">Orienta IA</span>
                <span className="bg-[#2BB5A0]/20 text-[#2BB5A0] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-[#2BB5A0]/30 tracking-wide">
                  Para la SSSalud
                </span>
              </div>
              <p className="text-[11px] text-gray-300 font-sans hidden sm:block">
                Orientación sobre trámites de obras sociales y prepagas ante la SSSalud
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#2BB5A0] text-[#1F3A5F] font-semibold shadow-sm'
                      : 'text-gray-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.2 bg-[#E0AE3B] text-black text-[10px] font-bold rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#162a45] border-t border-white/10 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#2BB5A0] text-[#1F3A5F] font-semibold'
                    : 'text-gray-200 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-[#E0AE3B] text-black text-[10px] font-bold rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
