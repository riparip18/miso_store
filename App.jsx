import React, { useState, useMemo, useEffect } from 'react';
import { api } from './src/api.js';
import {
  MantineProvider,
  Container,
  Title,
  Paper,
  Group,
  Text,
  Table,
  Badge,
  Button,
  TextInput,
  NumberInput,
  Select,
  Tabs,
  ActionIcon,
  SimpleGrid,
  Stack,
  SegmentedControl,
  Grid,
  ScrollArea,
  Autocomplete,
  rem,
  createTheme
} from '@mantine/core';
import { Modal } from '@mantine/core';
import { Burger, Drawer } from '@mantine/core';
import { IconTrash, IconPlus, IconCalculator, IconPackage } from '@tabler/icons-react';
import { Notifications, notifications } from '@mantine/notifications';

// --- Utility: Format Rupiah ---
const toIDR = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

const theme = createTheme({
  primaryColor: 'violet',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  defaultRadius: 12,
  components: {
    Text: {
      styles: {
        root: { lineHeight: 1.4 }
      }
    },
    TextInput: {
      styles: {
        label: { fontSize: 12, fontWeight: 600, color: '#6b7280' },
        input: { height: 42 }
      }
    },
    NumberInput: {
      styles: {
        label: { fontSize: 12, fontWeight: 600, color: '#6b7280' },
        input: { height: 42 }
      }
    },
    Autocomplete: {
      styles: {
        label: { fontSize: 12, fontWeight: 600, color: '#6b7280' },
        input: { height: 42 }
      }
    },
    SegmentedControl: {
      styles: {
        root: { padding: 4 },
        label: { fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }
      }
    },
    Button: {
      styles: {
        root: { height: 42, fontWeight: 700, letterSpacing: 0.2 }
      }
    },
    Paper: {
      styles: {
        root: { borderRadius: 12 }
      }
    },
    Badge: {
      styles: {
        root: { borderRadius: 12, textTransform: 'none', letterSpacing: 0.2 }
      }
    },
    Table: {
      styles: {
        th: { fontWeight: 700 }
      }
    }
  }
});

function StorageStatus() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/.netlify/functions/health', { cache: 'no-store' });
        const json = await res.json();
        if (mounted) setStatus(json);
      } catch (e) {
        if (mounted) setStatus({ backend: 'unknown', db: { ok: false, error: e.message } });
      }
    })();
    return () => { mounted = false; };
  }, []);
  const backend = status?.backend;
  const ok = status?.db?.ok;
  const color = ok ? (backend === 'neon' ? 'indigo' : 'teal') : 'red';
  const label = backend === 'neon' ? 'Neon DB' : backend === 'blobs' ? 'Netlify Blobs' : 'Storage';
  return (
    <Badge color={color} variant="light" radius="lg">
      {label} {ok ? 'OK' : 'Error'} · {window.location.hostname}
    </Badge>
  );
}

// --- Main App Component ---
export default function FishSalesApp() {
  // --- State Data Dummy Awal ---
  // Start with empty; fill from backend
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('sales');
  const [menuOpened, setMenuOpened] = useState(false);

  // Load from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const inv = await api.getInventory();
        if (Array.isArray(inv)) setInventory(inv);
        const txs = await api.getTransactions();
        if (Array.isArray(txs)) setTransactions(txs);
      } catch {
        // Backend unavailable; keep empty
      }
    })();
  }, []);

  // --- Form States ---
  const today = new Date().toISOString().split('T')[0];
  const [newSale, setNewSale] = useState({ item: '', qty: 1, price: 0, status: 'Waiting', date: today });
  const [newStock, setNewStock] = useState({ name: '', qty: 0, buyPrice: 0 });
  const [editStock, setEditStock] = useState(null);
        <Paper withBorder radius="md" px="md" py="xs" mb="md" shadow="sm">
          <Group gap="sm">
            <Text fw={700} c="dimmed">Storage</Text>
            <StorageStatus />
              <EnvStatus />
          </Group>
        </Paper>

  function EnvStatus() {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
    const isProd = /netlify\.app$|\.netlify\.app$|vercel\.app$|\bdomain\b/.test(host) || host === 'localhost' ? false : true;
    return (
      <Badge color={isProd ? 'violet' : 'gray'} variant="outline" radius="lg">
        {isProd ? 'Production' : 'Preview/Dev'} · {host}
      </Badge>
    );
  }
  const [editOpen, setEditOpen] = useState(false);
  
  // Update harga otomatis ketika item dipilih
  const handleItemChange = (itemName) => {
    const selectedItem = inventory.find(inv => inv.name === itemName);
    setNewSale({
      ...newSale,
      item: itemName,
      price: selectedItem ? selectedItem.buyPrice : 0
    });
  };
  
  //Filter State untuk Tab Penjualan
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState(''); 
  const [filterItem, setFilterItem] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // --- Logic Kalkulasi Dashboard ---
  const stats = useMemo(() => {
    const totalRevenue = transactions.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    const totalPaid = transactions
      .filter(t => t.status === 'Paid')
      .reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    const totalWaiting = transactions
      .filter(t => t.status === 'Waiting')
      .reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    
    const totalAssetValue = inventory.reduce((acc, curr) => acc + (curr.qty * curr.buyPrice), 0);

    return { totalRevenue, totalPaid, totalWaiting, totalAssetValue };
  }, [transactions, inventory]);

  // --- Handlers ---
  const handleAddSale = () => {
    if (!newSale.item || newSale.qty < 1 || newSale.price < 1) {
      notifications.show({ title: 'Form belum lengkap', message: 'Item, qty, dan price wajib diisi.', color: 'red' });
      return;
    }

    const selectedItem = inventory.find(inv => inv.name === newSale.item);
    const newTx = { ...newSale };

    // Scenario A: item ada → kurangi stok jika cukup, jika kurang tetap boleh tambah transaksi (manual), tampilkan warning
    if (selectedItem) {
      if (selectedItem.qty >= newSale.qty) {
        setInventory(inventory.map(inv => 
          inv.name === newSale.item 
            ? { ...inv, qty: inv.qty - newSale.qty }
            : inv
        ));
      } else {
        notifications.show({ title: 'Stok kurang', message: `Tersisa ${selectedItem.qty}. Transaksi manual tetap ditambahkan.`, color: 'orange' });
      }
    } else {
      // Scenario B: item tidak ada → tetap boleh tambah transaksi manual tanpa perubahan inventory
      notifications.show({ title: 'Item tidak ada', message: 'Transaksi manual ditambahkan tanpa perubahan inventory.', color: 'blue' });
    }

    api.addTransaction(newTx)
      .then((saved) => setTransactions([...transactions, saved]))
      .catch((e) => {
        const msg = (e && e.message) ? e.message : 'Gagal menyimpan transaksi ke server';
        notifications.show({ title: 'Gagal menyimpan transaksi', message: String(msg), color: 'red' });
      });
    setNewSale({ item: '', qty: 1, price: 0, status: 'Waiting', date: today });
  };

  const handleAddStock = () => {
    if (!newStock.name || newStock.qty < 0 || newStock.buyPrice < 0) return;
    const newItem = { ...newStock };
    api.addInventory(newItem)
      .then((saved) => setInventory([...inventory, saved]))
      .catch(() => notifications.show({ title: 'Gagal menyimpan stok', message: 'Coba lagi nanti', color: 'red' }));
    setNewStock({ name: '', qty: 0, buyPrice: 0 });
  };

  const deleteTransaction = (id) => {
    api.deleteTransaction(id)
      .then(() => setTransactions(transactions.filter(t => t.id !== id)))
      .catch(() => notifications.show({ title: 'Gagal menghapus transaksi', message: 'Coba lagi nanti', color: 'red' }));
  };

  const deleteInventory = (id) => {
    api.deleteInventory(id)
      .then(() => setInventory(inventory.filter(t => t.id !== id)))
      .catch(() => notifications.show({ title: 'Gagal menghapus stok', message: 'Coba lagi nanti', color: 'red' }));
  };

  const startEditInventory = (item) => {
    setEditStock({ ...item });
    setEditOpen(true);
  };

  const saveEditInventory = () => {
    if (!editStock || !editStock.name) return;
    api.updateInventory(editStock)
      .then(() => {
        setInventory(inventory.map(i => (i.id === editStock.id ? { ...i, ...editStock } : i)));
        setEditOpen(false);
        setEditStock(null);
        notifications.show({ title: 'Inventory updated', message: 'Saved successfully', color: 'teal' });
      })
      .catch(() => notifications.show({ title: 'Gagal update stok', message: 'Coba lagi nanti', color: 'red' }));
  };

  const updateTransactionStatus = (id) => {
    const updated = transactions.find(t => t.id === id);
    if (!updated) return;
    const toggled = { ...updated, status: updated.status === 'Paid' ? 'Waiting' : 'Paid' };
    api.updateTransaction(toggled)
      .then(() => setTransactions(transactions.map(t => (t.id === id ? toggled : t))))
      .catch(() => notifications.show({ title: 'Gagal update status', message: 'Coba lagi nanti', color: 'red' }));
  };

  // Remove localStorage persistence; backend is source of truth

  // --- Filter Logic ---
  const filteredTransactions = transactions.filter(t => {
    const statusMatch = filterStatus === 'All' || t.status === filterStatus;
    const dateMatch = !filterDate || t.date === filterDate;
    const itemMatch = !filterItem || t.item.toLowerCase().includes(filterItem.toLowerCase());
    return statusMatch && dateMatch && itemMatch;
  });

  // --- Inventory search ---
  const [inventoryQuery, setInventoryQuery] = useState('');
  const filteredInventory = useMemo(() => {
    const q = inventoryQuery.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter((i) => i.name.toLowerCase().includes(q));
  }, [inventory, inventoryQuery]);

  // --- Sales total for filtered list ---
  const salesTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + (t.price * t.qty), 0);
  }, [filteredTransactions]);

  const exportCsv = () => {
    const headers = ['date','item','qty','price','status','total'];
    const rows = transactions.map(t => [t.date, t.item, t.qty, t.price, t.status, t.price * t.qty]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportInventoryCsv = () => {
    const headers = ['name','qty','buyPrice','totalValue'];
    const rows = inventory.map(i => [i.name, i.qty, i.buyPrice, i.qty * i.buyPrice]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const cardStyle = {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    justifyContent: 'center',
    minHeight: rem(100),
  };

  const formPaperStyle = {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.06)'
  };

  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-right" zIndex={2000} />
      <Container fluid py="md" style={{ minHeight: '100vh', paddingBottom: rem(24), maxWidth: '1440px' }}>
        <Grid gutter="md">
          <Grid.Col span={12}>
            {/* Header */}
            <Group justify="space-between" mb="md">
              <div>
                <Title order={2} style={{ fontWeight: 800, letterSpacing: 0.2 }}>Sales & Inventory</Title>
                <Text c="dimmed" size="sm">Track sales, manage stock, and monitor totals</Text>
              </div>
              <Group visibleFrom="sm">
                <Button variant="light" onClick={()=>setActiveTab('inventory')}>Manage</Button>
                <Button variant="filled" color="teal" onClick={exportCsv}>Export Sales CSV</Button>
                <Button variant="filled" color="indigo" onClick={exportInventoryCsv}>Export Inventory CSV</Button>
              </Group>
              <Burger opened={menuOpened} onClick={() => setMenuOpened((o) => !o)} hiddenFrom="sm" aria-label="Toggle navigation" />
            </Group>

            <Drawer opened={menuOpened} onClose={() => setMenuOpened(false)} title="Menu" padding="md" hiddenFrom="sm">
              <Stack>
                <Button variant={activeTab==='sales'?'filled':'light'} onClick={()=>{setActiveTab('sales'); setMenuOpened(false);}}>Sales</Button>
                <Button variant={activeTab==='inventory'?'filled':'light'} onClick={()=>{setActiveTab('inventory'); setMenuOpened(false);}}>Inventory</Button>
                <Button variant={activeTab==='analytics'?'filled':'light'} onClick={()=>{setActiveTab('analytics'); setMenuOpened(false);}}>Analytics</Button>
                <Button variant={activeTab==='report'?'filled':'light'} onClick={()=>{setActiveTab('report'); setMenuOpened(false);}}>Report</Button>
                <Button variant="light" onClick={()=>{setActiveTab('inventory'); setMenuOpened(false);}}>Manage</Button>
                <Button variant="filled" color="teal" onClick={()=>{exportCsv(); setMenuOpened(false);}}>Export Sales CSV</Button>
                <Button variant="filled" color="indigo" onClick={()=>{exportInventoryCsv(); setMenuOpened(false);}}>Export Inventory CSV</Button>
              </Stack>
            </Drawer>

            {/* Dashboard cards removed; see Overview & Report tabs */}

        {/* Main Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab} variant="default" radius="lg">
              <Tabs.List mb="md" style={{ border: 'none', background: 'white', padding: '6px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(23,23,23,0.06)' }}>
                <Tabs.Tab value="sales" fw={600}>Sales</Tabs.Tab>
                <Tabs.Tab value="inventory" fw={600}>Inventory</Tabs.Tab>
                <Tabs.Tab value="analytics" fw={600}>Analytics</Tabs.Tab>
                <Tabs.Tab value="report" fw={600}>Report</Tabs.Tab>
              </Tabs.List>
              {/* --- TAB: ANALYTICS (reintroduced) --- */}
              <Tabs.Panel value="analytics">
                <Paper withBorder radius="md" p="md" mb="md">
                  <Text fw={700} mb="sm">Top Items (by revenue)</Text>
                  <Table highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Item</Table.Th>
                        <Table.Th ta="right">Qty</Table.Th>
                        <Table.Th ta="right">Revenue</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {Object.values(
                        transactions.reduce((acc, t) => {
                          const key = t.item;
                          if (!acc[key]) acc[key] = { item: key, qty: 0, revenue: 0 };
                          acc[key].qty += t.qty;
                          acc[key].revenue += t.price * t.qty;
                          return acc;
                        }, {})
                      ).sort((a,b)=>b.revenue-a.revenue).map(row => (
                        <Table.Tr key={row.item}>
                          <Table.Td>{row.item}</Table.Td>
                          <Table.Td ta="right">{row.qty}</Table.Td>
                          <Table.Td ta="right">{toIDR(row.revenue)}</Table.Td>
                        </Table.Tr>
                      ))}
                      {transactions.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={3} c="dimmed" ta="center">No data yet</Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Paper>
              </Tabs.Panel>

          {/* --- TAB 1: SALES --- */}
              <Tabs.Panel value="sales">
                {/* Filter Bar */}
                <Paper withBorder radius="md" p="md" mb="md">
                  <Grid gutter="sm" align="end">
                    <Grid.Col span={{ base: 12, md: 3 }} className="mobile-hide">
                      <TextInput label="Date filter" placeholder="Select date" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                    </Grid.Col>
                    {/* Status filter removed for cleaner mobile view */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <TextInput label="Item filter" placeholder="Search item" value={filterItem} onChange={(e)=>setFilterItem(e.target.value)} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 6, md: 1 }}>
                      <Button variant="light" fullWidth onClick={()=>{ setFilterDate(''); setFilterItem && setFilterItem(''); }}>Reset</Button>
                    </Grid.Col>
                    <Grid.Col span={{ base: 6, md: 1 }}>
                      <Button fullWidth onClick={()=>{/* filters already reactive */}}>Apply</Button>
                    </Grid.Col>
                  </Grid>
                </Paper>

                {/* Entry Form */}
                  <Paper withBorder radius="md" p="md" mb="md">
              <Grid gutter="md" align="end">
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Autocomplete
                    label="Item"
                    placeholder="Type or select item"
                    data={inventory.map(inv => inv.name)}
                    value={newSale.item}
                    onChange={(val) => {
                      setNewSale(prev => ({ ...prev, item: val }));
                      const matched = inventory.find(inv => inv.name.toLowerCase() === val.toLowerCase());
                      if (matched) {
                        setNewSale(prev => ({ ...prev, price: matched.buyPrice }));
                      }
                    }}
                    onBlur={() => {
                      if (!newSale.item) return;
                      const matched = inventory.find(inv => inv.name.toLowerCase() === newSale.item.toLowerCase());
                      if (matched && newSale.price === 0) {
                        setNewSale(prev => ({ ...prev, price: matched.buyPrice }));
                      }
                    }}
                    size="md"
                    radius="lg"
                    styles={{ label: { fontSize: '12px', fontWeight: 600, color: '#6b7280' } }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 2 }}>
                  <NumberInput
                    label="Quantity"
                    min={1}
                    value={newSale.qty}
                    onChange={(val) => setNewSale({...newSale, qty: val})}
                    size="md"
                    radius="lg"
                    styles={{ label: { fontSize: '12px', fontWeight: 600, color: '#6b7280' } }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 2 }}>
                  <NumberInput
                    label="Price"
                    prefix="Rp "
                    thousandSeparator
                    value={newSale.price}
                    onChange={(val) => setNewSale({...newSale, price: val})}
                    size="md"
                    radius="lg"
                    hideControls
                    styles={{ label: { fontSize: '12px', fontWeight: 600, color: '#6b7280' } }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 2 }}>
                  <TextInput
                    label="Date"
                    type="date"
                    value={newSale.date}
                    onChange={(e) => setNewSale({...newSale, date: e.target.value})}
                    size="md"
                    radius="lg"
                    styles={{ label: { fontSize: '12px', fontWeight: 600, color: '#6b7280' }, input: { cursor: 'pointer' } }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Text size="xs" fw={700} c="dimmed" mb={6}>Status</Text>
                  <SegmentedControl
                    value={newSale.status}
                    onChange={(val) => setNewSale({...newSale, status: val})}
                    radius="xl"
                    size="md"
                    data={[
                      { label: 'Paid', value: 'Paid' },
                      { label: 'Pending', value: 'Waiting' },
                    ]}
                    fullWidth
                    styles={{ root: { overflow: 'hidden' }, label: { whiteSpace: 'nowrap' } }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 2 }}>
                  <Button
                    onClick={handleAddSale}
                    size="md"
                    radius="xl"
                    variant="filled"
                    fw={600}
                    fullWidth
                    leftSection={<IconPlus size={16} />}
                    style={{ marginTop: rem(8), letterSpacing: '0.4px' }}
                  >
                    Add Sale
                  </Button>
                </Grid.Col>
              </Grid>
                </Paper>
            
            <Group justify="space-between" mb="md">
              <TextInput
                className="mobile-hide"
                placeholder="Filter by date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                size="sm"
                radius="xl"
                w={200}
                styles={{ 
                  input: { 
                    fontWeight: 500, 
                    cursor: 'pointer'
                  } 
                }}
                rightSection={
                  filterDate && (
                    <ActionIcon size="sm" variant="subtle" color="gray" radius="xl" onClick={() => setFilterDate('')}>
                      ✕
                    </ActionIcon>
                  )
                }
              />
              <SegmentedControl 
                value={filterStatus}
                onChange={setFilterStatus}
                size="sm"
                radius="xl"
                data={[
                  { label: 'All', value: 'All' },
                  { label: '✓ Paid', value: 'Paid' },
                  { label: '⏳ Pending', value: 'Waiting' },
                ]}
              />
            </Group>

            <Paper withBorder radius="xl" shadow="sm" bg="white">
              <ScrollArea style={{ maxHeight: 420 }} type="always">
              <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="lg" withColumnBorders={false}>
                <Table.Thead style={{ background: '#f8f9fa', boxShadow: 'inset 0 -1px 0 #edf2f7' }}>
                  <Table.Tr>
                    <Table.Th fw={700} c="dark" style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>Date</Table.Th>
                    <Table.Th fw={700} c="dark" style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>Item</Table.Th>
                    <Table.Th fw={600} c="dark" style={{ textAlign: 'right', width: 70, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>qty</Table.Th>
                    <Table.Th fw={600} c="dark" style={{ textAlign: 'right', width: 110, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>Price</Table.Th>
                    <Table.Th fw={700} c="dark" style={{ textAlign: 'right', width: 120, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>Total</Table.Th>
                    <Table.Th fw={700} c="dark" style={{ textAlign: 'center', width: 110, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>Status</Table.Th>
                    <Table.Th style={{ width: 48, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 2 }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredTransactions.map((t) => (
                    <Table.Tr key={t.id}>
                      <Table.Td c="dimmed" size="sm" fw={600}>{new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</Table.Td>
                      <Table.Td fw={600} size="sm">{t.item}</Table.Td>
                      <Table.Td c="dimmed" fw={600} ta="right">{t.qty}x</Table.Td>
                      <Table.Td c="dimmed" size="sm" ta="right">{toIDR(t.price)}</Table.Td>
                      <Table.Td fw={800} c="dark" ta="right">{toIDR(t.price * t.qty)}</Table.Td>
                      <Table.Td ta="center">
                        <Badge 
                          color={t.status === 'Paid' ? 'teal' : 'orange'} 
                          variant="filled"
                          size="md"
                          radius="xl"
                          style={{ cursor: 'pointer', fontWeight: 600, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px', minWidth: '80px' }}
                          onClick={() => updateTransactionStatus(t.id)}
                        >
                          {t.status === 'Paid' ? 'Paid' : 'Pending'}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="center">
                        <ActionIcon color="gray" variant="subtle" radius="xl" onClick={() => deleteTransaction(t.id)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={7} ta="center" py="xl" c="dimmed" fw={600}>
                        No transactions yet. Start adding!
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
              </ScrollArea>
            </Paper>
              {/* Sales total footer */}
              <Group justify="flex-end" mt="sm" mb="md">
                <Paper withBorder radius="md" px="md" py="xs" bg="white">
                  <Group gap="sm">
                    <Text fw={700} c="dimmed">Total</Text>
                    <Text fw={900} c="dark">{toIDR(salesTotal)}</Text>
                  </Group>
                </Paper>
              </Group>
              </Tabs.Panel>

          {/* --- TAB 2: INVENTORY --- */}
              <Tabs.Panel value="inventory">
                <Paper withBorder radius="md" mb="md" shadow="sm" style={formPaperStyle}>
                  <Grid gutter="md" align="end">
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput label="Item Name" placeholder="e.g. King Jelly" value={newStock.name} onChange={(e) => setNewStock({ ...newStock, name: e.target.value })} size="md" radius="lg" styles={{ label: { fontSize: '12px', fontWeight: 600, color: '#6b7280' } }} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 6, sm: 2 }}>
                      <NumberInput label="Stock" min={0} value={newStock.qty} onChange={(val) => setNewStock({ ...newStock, qty: val })} size="md" radius="lg" styles={{ label: { fontSize: '12px', fontWeight: 600, color: '#6b7280' } }} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 6, sm: 3 }}>
                      <NumberInput label="Cost Price" prefix="Rp " thousandSeparator value={newStock.buyPrice} onChange={(val) => setNewStock({ ...newStock, buyPrice: val })} size="md" radius="lg" hideControls styles={{ label: { fontSize: '12px', fontWeight: 600, color: '#6b7280' } }} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 1 }}>
                      <Button onClick={handleAddStock} size="md" radius="xl" variant="filled" fw={600} fullWidth leftSection={<IconPlus size={18} />} style={{ marginTop: rem(8) }}>Add</Button>
                    </Grid.Col>
                  </Grid>
                </Paper>

                <Paper px="lg" py="md" withBorder radius="md" bg="white" mb="md" shadow="sm">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed" fw={700} tt="uppercase">Total Assets</Text>
                    <Text size="xl" c="dark" fw={900}>{toIDR(stats.totalAssetValue)}</Text>
                  </Group>
                </Paper>

              {/* Inventory search */}
              <Paper withBorder radius="md" px="lg" py="md" bg="white" mb="md" shadow="sm">
                <TextInput
                  label="Search Inventory"
                  placeholder="Type item name"
                  value={inventoryQuery}
                  onChange={(e) => setInventoryQuery(e.target.value)}
                  radius="lg"
                />
              </Paper>

              <Paper withBorder radius="md" shadow="sm" overflow="hidden" bg="white">
              <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg" style={{ tableLayout: 'fixed' }}>
                <Table.Thead style={{ background: '#f8f9fa' }}>
                  <Table.Tr>
                    <Table.Th fw={600} c="dark">item</Table.Th>
                    <Table.Th fw={700} c="dark" style={{ textAlign: 'right' }}>Stock</Table.Th>
                    <Table.Th fw={700} c="dark" style={{ textAlign: 'right' }}>Cost Price</Table.Th>
                    <Table.Th fw={800} c="dark" style={{ textAlign: 'right' }}>Total Value</Table.Th>
                    <Table.Th style={{ width: 72, textAlign: 'center' }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredInventory.map((item) => (
                    <Table.Tr key={item.id}>
                      <Table.Td fw={600} size="sm">{item.name}</Table.Td>
                      <Table.Td c="dimmed" fw={600} ta="right">{item.qty} pcs</Table.Td>
                      <Table.Td c="dimmed" size="sm" ta="right">{toIDR(item.buyPrice)}</Table.Td>
                      <Table.Td fw={800} c="dark" ta="right">{toIDR(item.qty * item.buyPrice)}</Table.Td>
                      <Table.Td ta="center">
                        <Group gap="xs" justify="center">
                          <ActionIcon color="blue" variant="light" radius="xl" onClick={() => startEditInventory(item)}>✎</ActionIcon>
                          <ActionIcon color="gray" variant="light" radius="xl" onClick={() => deleteInventory(item.id)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
                </Paper>
              </Tabs.Panel>

              {/* --- TAB: REPORT --- */}
              <Tabs.Panel value="report">
                <Paper withBorder radius="md" p="md" mb="md">
                  <Text fw={700} mb="sm">Exports</Text>
                  <Group>
                    <Button variant="filled" color="teal" onClick={exportCsv}>Export Sales CSV</Button>
                    <Button variant="filled" color="indigo" onClick={exportInventoryCsv}>Export Inventory CSV</Button>
                  </Group>
                </Paper>
                <Paper withBorder radius="md" p="md">
                  <Text fw={700} mb="sm">Summary</Text>
                  <Table verticalSpacing="sm">
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td>Revenue</Table.Td>
                        <Table.Td ta="right">{toIDR(stats.totalRevenue)}</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>Paid</Table.Td>
                        <Table.Td ta="right">{toIDR(stats.totalPaid)}</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>Pending</Table.Td>
                        <Table.Td ta="right">{toIDR(stats.totalWaiting)}</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>Total Assets</Table.Td>
                        <Table.Td ta="right">{toIDR(stats.totalAssetValue)}</Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                </Paper>
              </Tabs.Panel>
            </Tabs>
          </Grid.Col>
        </Grid>
      </Container>
      {/* Inventory Edit Modal */}
      <Modal
        opened={editOpen}
        onClose={() => { setEditOpen(false); setEditStock(null); }}
        title="Edit Inventory"
        centered
        radius="md"
      >
        {editStock && (
          <Stack gap="md">
            <TextInput
              label="Item Name"
              value={editStock.name}
              onChange={(e) => setEditStock({ ...editStock, name: e.target.value })}
              radius="lg"
            />
            <NumberInput
              label="Stock"
              min={0}
              value={editStock.qty}
              onChange={(val) => setEditStock({ ...editStock, qty: val ?? 0 })}
              radius="lg"
            />
            <NumberInput
              label="Cost Price"
              prefix="Rp "
              thousandSeparator
              hideControls
              value={editStock.buyPrice}
              onChange={(val) => setEditStock({ ...editStock, buyPrice: val ?? 0 })}
              radius="lg"
            />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={() => { setEditOpen(false); setEditStock(null); }}>Cancel</Button>
              <Button color="blue" onClick={saveEditInventory}>Save</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </MantineProvider>
  );
}

// Modal placed near the end of component return