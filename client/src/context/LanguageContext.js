import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  en: {
    // Navigation
    home: 'Home',
    services: 'Services',
    booking: 'Booking',
    dashboard: 'Dashboard',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    
    // Booking
    selectServices: 'Select Services',
    selectDateTime: 'Select Date & Time',
    customerInfo: 'Customer Information',
    bookingConfirmation: 'Booking Confirmation',
    name: 'Name',
    phone: 'Phone Number',
    email: 'Email (Optional)',
    notes: 'Notes (Optional)',
    totalPrice: 'Total Price',
    duration: 'Duration',
    bookNow: 'Book Now',
    bookingSuccess: 'Booking Successful!',
    confirmationCode: 'Confirmation Code',
    
    // Services
    price: 'Price',
    duration: 'Duration',
    description: 'Description',
    requirements: 'Requirements',
    
    // Vendor Dashboard
    myServices: 'My Services',
    addService: 'Add Service',
    editService: 'Edit Service',
    bookings: 'Bookings',
    qrCode: 'QR Code',
    generateQR: 'Generate QR Code',
    downloadQR: 'Download QR Code',
    shareLink: 'Share Link',
    
    // Status
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
    noShow: 'No Show'
  },
  
  ms: {
    // Navigation
    home: 'Utama',
    services: 'Perkhidmatan',
    booking: 'Tempahan',
    dashboard: 'Dashboard',
    login: 'Log Masuk',
    register: 'Daftar',
    logout: 'Log Keluar',
    
    // Common
    loading: 'Memuatkan...',
    error: 'Ralat',
    success: 'Berjaya',
    cancel: 'Batal',
    confirm: 'Sahkan',
    save: 'Simpan',
    edit: 'Edit',
    delete: 'Padam',
    back: 'Kembali',
    next: 'Seterusnya',
    previous: 'Sebelumnya',
    close: 'Tutup',
    
    // Booking
    selectServices: 'Pilih Perkhidmatan',
    selectDateTime: 'Pilih Tarikh & Masa',
    customerInfo: 'Maklumat Pelanggan',
    bookingConfirmation: 'Pengesahan Tempahan',
    name: 'Nama',
    phone: 'Nombor Telefon',
    email: 'Emel (Pilihan)',
    notes: 'Nota (Pilihan)',
    totalPrice: 'Jumlah Harga',
    duration: 'Tempoh',
    bookNow: 'Tempah Sekarang',
    bookingSuccess: 'Tempahan Berjaya!',
    confirmationCode: 'Kod Pengesahan',
    
    // Services
    price: 'Harga',
    duration: 'Tempoh',
    description: 'Penerangan',
    requirements: 'Keperluan',
    
    // Vendor Dashboard
    myServices: 'Perkhidmatan Saya',
    addService: 'Tambah Perkhidmatan',
    editService: 'Edit Perkhidmatan',
    bookings: 'Tempahan',
    qrCode: 'Kod QR',
    generateQR: 'Jana Kod QR',
    downloadQR: 'Muat Turun Kod QR',
    shareLink: 'Kongsi Pautan',
    
    // Status
    pending: 'Menunggu',
    confirmed: 'Disahkan',
    cancelled: 'Dibatalkan',
    completed: 'Selesai',
    noShow: 'Tidak Hadir'
  },
  
  zh: {
    // Navigation
    home: '首页',
    services: '服务',
    booking: '预订',
    dashboard: '仪表板',
    login: '登录',
    register: '注册',
    logout: '登出',
    
    // Common
    loading: '加载中...',
    error: '错误',
    success: '成功',
    cancel: '取消',
    confirm: '确认',
    save: '保存',
    edit: '编辑',
    delete: '删除',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    close: '关闭',
    
    // Booking
    selectServices: '选择服务',
    selectDateTime: '选择日期和时间',
    customerInfo: '客户信息',
    bookingConfirmation: '预订确认',
    name: '姓名',
    phone: '电话号码',
    email: '电子邮件（可选）',
    notes: '备注（可选）',
    totalPrice: '总价',
    duration: '时长',
    bookNow: '立即预订',
    bookingSuccess: '预订成功！',
    confirmationCode: '确认码',
    
    // Services
    price: '价格',
    duration: '时长',
    description: '描述',
    requirements: '要求',
    
    // Vendor Dashboard
    myServices: '我的服务',
    addService: '添加服务',
    editService: '编辑服务',
    bookings: '预订',
    qrCode: '二维码',
    generateQR: '生成二维码',
    downloadQR: '下载二维码',
    shareLink: '分享链接',
    
    // Status
    pending: '待确认',
    confirmed: '已确认',
    cancelled: '已取消',
    completed: '已完成',
    noShow: '未到'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    localStorage.getItem('language') || 'en'
  );

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const value = {
    language,
    setLanguage: changeLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
