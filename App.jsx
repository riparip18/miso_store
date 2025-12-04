import React, { useState, useMemo } from 'react';
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
  SegmentedControl,
  Grid,
  ScrollArea,
  Autocomplete,
  rem,
  createTheme
} from '@mantine/core';
import { IconTrash, IconPlus, IconCalculator, IconPackage } from '@tabler/icons-react';

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
  defaultRadius: 'lg',
});

// --- Main App Component ---
export default function FishSalesApp() {
  // --- State Data Dummy Awal ---
  const [inventory, setInventory] = useState([
    { id: 1, name: 'King Jelly', qty: 50, buyPrice: 5000 },
    { id: 2, name: 'Megalodon', qty: 10, buyPrice: 15000 },
  ]);

  const [transactions, setTransactions] = useState([
    { id: 1, item: 'King Jelly', qty: 2, price: 10000, status: 'Paid', date: '2025-12-01' },
    { id: 2, item: 'Megalodon', qty: 1, price: 20000, status: 'Paid', date: '2025-12-01' },
    { id: 3, item: 'Megalodon', qty: 1, price: 20000, status: 'Waiting', date: '2025-12-02' },
    { id: 4, item: 'Tumbal', qty: 43, price: 3500, status: 'Paid', date: '2025-12-02' },
  ]);

  // --- Form States ---
  const today = new Date().toISOString().split('T')[0];
  const [newSale, setNewSale] = useState({ item: '', qty: 1, price: 0, status: 'Paid', date: today });
  const [newStock, setNewStock] = useState({ name: '', qty: 0, buyPrice: 0 });
  
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
    if (!newSale.item || newSale.qty < 1 || newSale.price < 1) return;
    
    // Kurangi stok inventory
    const selectedItem = inventory.find(inv => inv.name === newSale.item);
    if (selectedItem && selectedItem.qty >= newSale.qty) {
      setInventory(inventory.map(inv => 
        inv.name === newSale.item 
          ? { ...inv, qty: inv.qty - newSale.qty }
          : inv
      ));
      
      setTransactions([...transactions, { ...newSale, id: Date.now() }]);
      setNewSale({ item: '', qty: 1, price: 0, status: 'Paid', date: today });
    } else {
      alert('Stock tidak cukup!');
    }
  };

  const handleAddStock = () => {
    if (!newStock.name || newStock.qty < 0 || newStock.buyPrice < 0) return;
    setInventory([...inventory, { ...newStock, id: Date.now() }]);
    setNewStock({ name: '', qty: 0, buyPrice: 0 });
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const deleteInventory = (id) => {
    setInventory(inventory.filter(t => t.id !== id));
  };

  const updateTransactionStatus = (id) => {
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, status: t.status === 'Paid' ? 'Waiting' : 'Paid' } : t
    ));
  };

  // --- Filter Logic ---
  const filteredTransactions = transactions.filter(t => {
    const statusMatch = filterStatus === 'All' || t.status === filterStatus;
    const dateMatch = !filterDate || t.date === filterDate;
    return statusMatch && dateMatch;
  });

  const cardStyle = {
    background: 'white',
    padding: 'var(--mantine-spacing-lg)',
    borderRadius: 'var(--mantine-radius-xl)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: rem(120),
  };

  const formPaperStyle = {
    background: 'white',
    padding: 'var(--mantine-spacing-lg)',
    borderRadius: 'var(--mantine-radius-xl)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  };

  return (
    <MantineProvider theme={theme}>
      <Container size="lg" py="xl" style={{ minHeight: '100vh', paddingBottom: rem(64) }}>
        
        {/* Header */}
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={1} size="h2" style={{ fontWeight: 800 }}>🐟 fish sales</Title>
            <Text c="dimmed" size="xs" fw={500}>track it. sell it. vibe with it.</Text>
          </div>
        </Group>

        {/* Dashboard Cards */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
          <Paper withBorder style={cardStyle}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={4}>total revenue</Text>
            <Text fw={800} size="xl" c="dark" style={{ lineHeight: 1 }}>{toIDR(stats.totalRevenue)}</Text>
          </Paper>
          <Paper withBorder style={cardStyle}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={4}>paid</Text>
            <Text fw={800} size="xl" c="teal.6" style={{ lineHeight: 1 }}>{toIDR(stats.totalPaid)}</Text>
          </Paper>
          <Paper withBorder style={cardStyle}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={4}>pending</Text>
            <Text fw={800} size="xl" c="orange.6" style={{ lineHeight: 1 }}>{toIDR(stats.totalWaiting)}</Text>
          </Paper>
        </SimpleGrid>

        {/* Main Tabs */}
        <Tabs defaultValue="sales" variant="default" radius="lg">
          <Tabs.List mb="lg" style={{ border: 'none', background: 'white', padding: '4px', borderRadius: '12px' }}>
            <Tabs.Tab value="sales" leftSection={<IconCalculator size={16} />} fw={600}>
              sales
            </Tabs.Tab>
            <Tabs.Tab value="inventory" leftSection={<IconPackage size={16} />} fw={600}>
              inventory
            </Tabs.Tab>
          </Tabs.List>

          {/* --- TAB 1: SALES --- */}
          <Tabs.Panel value="sales">
            <Paper withBorder radius="xl" mb="lg" shadow="sm" style={formPaperStyle}>
              <Grid gutter="md" align="end">
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Autocomplete
                    label="Item"
                    placeholder="type or select"
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
                <Grid.Col span={{ base: 6, sm: 1 }}>
                  <NumberInput
                    label="Qty"
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
                <Grid.Col span={{ base: 6, sm: 2 }}>
                  <Text size="xs" fw={600} c="dimmed" mb={4}>Status</Text>
                  <SegmentedControl
                    value={newSale.status}
                    onChange={(val) => setNewSale({...newSale, status: val})}
                    radius="l"
                    size="l"
                    data={[
                      { label: '✓ paid', value: 'Paid' },
                      { label: '⏳ pending', value: 'Waiting' },
                    ]}
                    fullWidth
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 1 }}>
                  <Button
                    onClick={handleAddSale}
                    size="l"
                    radius="l"
                    variant="filled"
                    fw={600}
                    fullWidth
                    leftSection={<IconPlus size={16} />}
                    style={{ marginTop: rem(4), letterSpacing: '0.5px' }}
                  >
                    add
                  </Button>
                </Grid.Col>
              </Grid>
            </Paper>
            
            <Group justify="space-between" mb="lg">
              <TextInput
                placeholder="🔍 filter by date..."
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                size="sm"
                radius="xl"
                w={200}
                styles={{ 
                  input: { 
                    fontWeight: 500, 
                    cursor: 'pointer',
                    '&::-webkit-calendar-picker-indicator': {
                      cursor: 'pointer'
                    }
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
                  { label: 'all', value: 'All' },
                  { label: '✓ paid', value: 'Paid' },
                  { label: '⏳ pending', value: 'Waiting' },
                ]}
              />
            </Group>

            <Paper withBorder radius="xl" shadow="sm" bg="white">
              <ScrollArea style={{ maxHeight: 420 }} type="always">
              <Table highlightOnHover striped verticalSpacing="xs" horizontalSpacing="md" withColumnBorders={false}>
                <Table.Thead style={{ background: '#f8f9fa' }}>
                  <Table.Tr>
                    <Table.Th fw={600} c="dark" style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>date</Table.Th>
                    <Table.Th fw={600} c="dark" style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>item</Table.Th>
                    <Table.Th fw={600} c="dark" style={{ textAlign: 'right', width: 70, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>qty</Table.Th>
                    <Table.Th fw={600} c="dark" style={{ textAlign: 'right', width: 110, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>price</Table.Th>
                    <Table.Th fw={600} c="dark" style={{ textAlign: 'right', width: 120, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>total</Table.Th>
                    <Table.Th fw={600} c="dark" style={{ textAlign: 'center', width: 90, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>status</Table.Th>
                    <Table.Th style={{ width: 48, position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 2 }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredTransactions.map((t) => (
                    <Table.Tr key={t.id}>
                      <Table.Td c="dimmed" size="sm" fw={500}>{new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</Table.Td>
                      <Table.Td fw={600} size="sm">{t.item}</Table.Td>
                      <Table.Td c="dimmed" fw={500} ta="right">{t.qty}x</Table.Td>
                      <Table.Td c="dimmed" size="sm" ta="right">{toIDR(t.price)}</Table.Td>
                      <Table.Td fw={700} c="dark" ta="right">{toIDR(t.price * t.qty)}</Table.Td>
                      <Table.Td ta="center">
                        <Badge 
                          color={t.status === 'Paid' ? 'teal' : 'orange'} 
                          variant="filled"
                          size="md"
                          radius="md"
                          style={{ cursor: 'pointer', fontWeight: 600, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}
                          onClick={() => updateTransactionStatus(t.id)}
                        >
                          {t.status === 'Paid' ? 'paid' : 'pending'}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="center">
                        <ActionIcon color="gray" variant="subtle" radius="lg" onClick={() => deleteTransaction(t.id)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={7} ta="center" py="xl" c="dimmed" fw={500}>
                        no transactions yet. start adding! ✨
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
              </ScrollArea>
            </Paper>
          </Tabs.Panel>

          {/* --- TAB 2: INVENTORY --- */}
          <Tabs.Panel value="inventory">
            <Paper withBorder radius="xl" mb="lg" shadow="sm" style={formPaperStyle}>
              <Grid gutter="md" align="end">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Item Name"
                    placeholder="e.g. King Jelly"
                    value={newStock.name}
                    onChange={(e) => setNewStock({...newStock, name: e.target.value})}
                    size="md"
                    radius="lg"
                    styles={{ label: { fontSize: '12px', fontWeight: 600, color: '#6b7280' } }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 2 }}>
                  <NumberInput
                    label="Stock"
                    min={0}
                    value={newStock.qty}
                    onChange={(val) => setNewStock({...newStock, qty: val})}
                    size="md"
                    radius="lg"
                    styles={{ label: { fontSize: '12px', fontWeight: 600, color: '#6b7280' } }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <NumberInput
                    label="Cost Price"
                    prefix="Rp "
                    thousandSeparator
                    value={newStock.buyPrice}
                    onChange={(val) => setNewStock({...newStock, buyPrice: val})}
                    size="md"
                    radius="lg"
                    hideControls
                    styles={{ label: { fontSize: '12px', fontWeight: 600, color: '#6b7280' } }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 1 }}>
                  <Button 
                    onClick={handleAddStock} 
                    size="md" 
                    radius="lg" 
                    variant="filled"
                    fw={600}
                    fullWidth
                    leftSection={<IconPlus size={18} />}
                    style={{ marginTop: rem(4) }}
                  >
                    add
                  </Button>
                </Grid.Col>
              </Grid>
            </Paper>
            
            <Paper px="lg" py="md" withBorder radius="xl" bg="white" mb="lg" shadow="sm">
              <Group justify="space-between">
                <Text size="sm" c="dimmed" fw={600} tt="uppercase">total assets</Text>
                <Text size="xl" c="dark" fw={800}>{toIDR(stats.totalAssetValue)}</Text>
              </Group>
            </Paper>

            <Paper withBorder radius="xl" shadow="sm" overflow="hidden" bg="white">
              <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                <Table.Thead style={{ background: '#f8f9fa' }}>
                  <Table.Tr>
                    <Table.Th fw={600} c="dark">item</Table.Th>
                    <Table.Th fw={600} c="dark" style={{ textAlign: 'right' }}>stock</Table.Th>
                    <Table.Th fw={600} c="dark" style={{ textAlign: 'right' }}>cost price</Table.Th>
                    <Table.Th fw={600} c="dark" style={{ textAlign: 'right' }}>total value</Table.Th>
                    <Table.Th style={{ width: 40 }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {inventory.map((item) => (
                    <Table.Tr key={item.id}>
                      <Table.Td fw={600} size="sm">{item.name}</Table.Td>
                      <Table.Td c="dimmed" fw={500} ta="right">{item.qty} pcs</Table.Td>
                      <Table.Td c="dimmed" size="sm" ta="right">{toIDR(item.buyPrice)}</Table.Td>
                      <Table.Td fw={700} c="dark" ta="right">{toIDR(item.qty * item.buyPrice)}</Table.Td>
                      <Table.Td>
                         <ActionIcon color="gray" variant="subtle" radius="lg" onClick={() => deleteInventory(item.id)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>
        </Tabs>

      </Container>
    </MantineProvider>
  );
}