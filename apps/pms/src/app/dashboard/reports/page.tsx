'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  FileSpreadsheet,
  FileDown,
  Loader2
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const loadReportsData = async () => {
      setLoading(true);
      try {
        const res = await apiRequest('/reports/analytics-data');
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReportsData();
  }, []);

  const handleExportCSV = (reportType: string) => {
    if (!data) return;

    let csvContent = '';
    let filename = '';

    if (reportType === 'revenue') {
      csvContent = 'Month,Revenue (INR)\n';
      data.revenueTrend.forEach((row: any) => {
        csvContent += `"${row.label}",${row.value}\n`;
      });
      filename = 'revenue_report.csv';
    } else if (reportType === 'patients') {
      csvContent = 'Month,Registered Patients Count\n';
      data.patientGrowth.forEach((row: any) => {
        csvContent += `"${row.label}",${row.value}\n`;
      });
      filename = 'patient_growth_report.csv';
    } else if (reportType === 'treatments') {
      csvContent = 'Treatment Title,Count Completed\n';
      data.treatmentDistribution.forEach((row: any) => {
        csvContent += `"${row.label}",${row.value}\n`;
      });
      filename = 'treatments_report.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !data) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Reports & Export Panel</h1>
        <p className="text-xs sm:text-sm text-gray-400">Export financial summaries, treatments distributions, and patient registry counts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Export Card */}
        <div className="panel-card p-6 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/15 text-[#3B82F6] w-fit">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-extrabold text-base text-white">Revenue & Payments Reports</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Contains details of cash flow, invoices collected, and monthly growth breakdowns.</p>
          </div>
          <button
            onClick={() => handleExportCSV('revenue')}
            className="flex items-center justify-center space-x-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] text-white text-xs font-bold shadow-md cursor-pointer hover:opacity-90 transition-all"
          >
            <FileSpreadsheet size={16} />
            <span>Export Revenue CSV</span>
          </button>
        </div>

        {/* Patients Export Card */}
        <div className="panel-card p-6 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/15 text-emerald-400 w-fit">
              <Users size={20} />
            </div>
            <h3 className="font-extrabold text-base text-white">Patient Growth Reports</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Contains cumulative statistics of registered patient cohorts month-over-month.</p>
          </div>
          <button
            onClick={() => handleExportCSV('patients')}
            className="flex items-center justify-center space-x-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] text-white text-xs font-bold shadow-md cursor-pointer hover:opacity-90 transition-all"
          >
            <FileSpreadsheet size={16} />
            <span>Export Patients CSV</span>
          </button>
        </div>

        {/* Treatments Export Card */}
        <div className="panel-card p-6 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/15 text-[#D4AF37] w-fit">
              <BarChart3 size={20} />
            </div>
            <h3 className="font-extrabold text-base text-white">Treatment Distribution Reports</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Contains categorical breakdown of procedures completed by Dr. Manoj Kumar.</p>
          </div>
          <button
            onClick={() => handleExportCSV('treatments')}
            className="flex items-center justify-center space-x-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] text-white text-xs font-bold shadow-md cursor-pointer hover:opacity-90 transition-all"
          >
            <FileSpreadsheet size={16} />
            <span>Export Treatments CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
