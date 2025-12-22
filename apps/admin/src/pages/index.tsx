import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>StewiePay Admin</title>
      </Head>
      <main style={{ padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <p style={{ color: '#666', letterSpacing: 1, textTransform: 'uppercase' }}>Placeholder</p>
        <h1 style={{ fontSize: '2.25rem', marginTop: '0.5rem' }}>StewiePay Admin</h1>
        <p style={{ marginTop: '0.75rem', maxWidth: 520 }}>
          Admin panel scaffold is ready. Once dependencies are installed, start the dev server with
          <code style={{ marginLeft: 4 }}>yarn workspace @stewiepay/admin dev</code> to see this
          page.
        </p>
      </main>
    </>
  );
}













