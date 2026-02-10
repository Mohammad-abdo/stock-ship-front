import React from 'react';
import Header from './Header';
import FooterArabic from './FooterArabic';

/**
 * Layout component to handle page structure
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {boolean} props.showHeader - Whether to show header (default: true)
 * @param {boolean} props.showFooter - Whether to show footer (default: true)
 * @param {string} props.className - Additional CSS classes for the main container
 * @param {string} props.contentClassName - Additional CSS classes for the content wrapper
 */
export default function Layout({
  children,
  showHeader = true,
  showFooter = true,
  className = '',
  contentClassName = ''
}) {
  return (
    <div className={className}>
      {showHeader && <Header />}
      <main className={contentClassName}>
        {children}
      </main>
      {showFooter && <FooterArabic />}
    </div>
  );
}

/**
 * MainLayout - Standard layout with Header and Footer
 */
export function MainLayout({ children, className = '', contentClassName = '' }) {
  return (
    <Layout
      showHeader={true}
      showFooter={true}
      className={className}
      contentClassName={contentClassName}
    >
      {children}
    </Layout>
  );
}

/**
 * SimpleLayout - Layout without Header (for Login, SignUp pages)
 */
export function SimpleLayout({ children, className = '', contentClassName = '' }) {
  return (
    <Layout
      showHeader={false}
      showFooter={true}
      className={className}
      contentClassName={contentClassName}
    >
      {children}
    </Layout>
  );
}



