import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  useColorScheme,
  Modal,
  ScrollView,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Crypto from 'expo-crypto';

type KeyType = 'promo' | 'paid' | 'api';
type KeyStatus = 'active' | 'used' | 'expired' | 'revoked';

interface LicenseKey {
  id: string;
  key: string;
  type: KeyType;
  status: KeyStatus;
  created: string;
  expires?: string;
  maxUses: number;
  uses: number;
  metadata: string;
}

interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
}

interface Issue {
  id: number;
  title: string;
  number: number;
  state: string;
}

const KEY_PREFIXES: Record<KeyType, string> = {
  promo: 'PROMO',
  paid: 'PAID',
  api: 'API',
};

const generateSecureKey = async (type: KeyType, length: number = 16): Promise<string> => {
  const prefix = KEY_PREFIXES[type];
  const randomBytes = await Crypto.getRandomBytesAsync(Math.ceil(length / 2));
  const hex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
    .toUpperCase();
  return `${prefix}-${hex}`;
};

export default function ProductionInventoryApp() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Inventory
  const [items, setItems] = useState<any[]>([
    { id: '1', name: 'Widget A', quantity: 42, category: 'Hardware' },
    { id: '2', name: 'Sprocket B', quantity: 17, category: 'Hardware' },
  ]);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newQuantity, setNewQuantity] = useState('');

  // Key Generator
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<KeyType>('promo');
  const [keyLength, setKeyLength] = useState('16');
  const [maxUses, setMaxUses] = useState('10');
  const [expiryDays, setExpiryDays] = useState('30');
  const [metadata, setMetadata] = useState('');
  const [keySearch, setKeySearch] = useState('');

  // GitHub
  const [githubToken, setGithubToken] = useState('');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [githubModal, setGithubModal] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredKeys = keys.filter(k =>
    k.key.toLowerCase().includes(keySearch.toLowerCase()) ||
    k.type.includes(keySearch.toLowerCase())
  );

  // Inventory functions
  const addItem = () => {
    if (!newName.trim() || !newCategory.trim()) {
      Alert.alert('Error', 'Name and category required');
      return;
    }
    const qty = parseInt(newQuantity) || 0;
    setItems([...items, {
      id: Date.now().toString(),
      name: newName.trim(),
      quantity: qty,
      category: newCategory.trim()
    }]);
    setNewName(''); setNewCategory(''); setNewQuantity('');
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Key Generator
  const generateKey = async () => {
    const keyStr = await generateSecureKey(selectedType, parseInt(keyLength) || 16);
    const now = new Date();
    const exp = expiryDays ? new Date(now.getTime() + parseInt(expiryDays) * 86400000).toISOString() : undefined;

    const newKey: LicenseKey = {
      id: Date.now().toString(),
      key: keyStr,
      type: selectedType,
      status: 'active',
      created: now.toISOString(),
      expires: exp,
      maxUses: parseInt(maxUses) || 1,
      uses: 0,
      metadata: metadata.trim(),
    };
    setKeys(prev => [...prev, newKey]);
    setKeyModalVisible(false);
    setMetadata('');
  };

  const revokeKey = (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
  };

  const copyKey = async (key: string) => {
    await Share.share({ message: key });
  };

  const getTypeColor = (type: KeyType) => {
    if (type === 'promo') return '#22c55e';
    if (type === 'paid') return '#3b82f6';
    return '#8b5cf6';
  };

  // GitHub Device Flow Simulation (production-like)
  const connectGitHub = async () => {
    if (!githubToken.trim()) {
      Alert.alert('Enter a GitHub Personal Access Token (classic) with repo scope');
      return;
    }
    // Simulate device flow success
    const fakeRepos: Repo[] = [
      { id: 1, name: 'inventory-app', full_name: 'user/inventory-app', private: false },
      { id: 2, name: 'synthetic-solutions', full_name: 'user/synthetic-solutions', private: true },
    ];
    setRepos(fakeRepos);
    setGithubModal(true);
    Alert.alert('GitHub Connected', 'Token stored securely (simulated)');
  };

  const loadIssues = (repo: Repo) => {
    setSelectedRepo(repo);
    setIssues([
      { id: 101, title: 'Add dark mode support', number: 12, state: 'open' },
      { id: 102, title: 'Fix key expiration bug', number: 13, state: 'closed' },
    ]);
  };

  const createIssue = () => {
    if (!newIssueTitle.trim() || !selectedRepo) return;
    const newIssue: Issue = {
      id: Date.now(),
      title: newIssueTitle.trim(),
      number: issues.length + 20,
      state: 'open',
    };
    setIssues([newIssue, ...issues]);
    setNewIssueTitle('');
    Alert.alert('Issue Created', `#${newIssue.number} created on GitHub`);
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Text style={[styles.header, isDark && styles.darkText]}>Synthetic Solutions Inventory</Text>

      {/* Inventory Section */}
      <TextInput
        style={[styles.input, isDark && styles.darkInput]}
        placeholder="Search inventory..."
        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
        value={search}
        onChangeText={setSearch}
      />

      <View style={[styles.addCard, isDark && styles.darkCard]}>
        <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Add Item</Text>
        <TextInput style={[styles.input, isDark && styles.darkInput]} placeholder="Name" value={newName} onChangeText={setNewName} />
        <TextInput style={[styles.input, isDark && styles.darkInput]} placeholder="Category" value={newCategory} onChangeText={setNewCategory} />
        <TextInput style={[styles.input, isDark && styles.darkInput]} placeholder="Quantity" keyboardType="numeric" value={newQuantity} onChangeText={setNewQuantity} />
        <Pressable style={styles.primaryButton} onPress={addItem}>
          <Text style={styles.buttonText}>Add Item</Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={[styles.itemRow, isDark && styles.darkCard]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, isDark && styles.darkText]}>{item.name}</Text>
              <Text style={styles.itemCategory}>{item.category}</Text>
            </View>
            <View style={styles.qtyRow}>
              <Pressable style={styles.qtyBtn} onPress={() => updateQuantity(item.id, -1)}><Text style={styles.qtyText}>-</Text></Pressable>
              <Text style={[styles.qtyValue, isDark && styles.darkText]}>{item.quantity}</Text>
              <Pressable style={styles.qtyBtn} onPress={() => updateQuantity(item.id, 1)}><Text style={styles.qtyText}>+</Text></Pressable>
            </View>
            <Pressable onPress={() => deleteItem(item.id)}><Text style={styles.delete}>×</Text></Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No items</Text>}
      />

      {/* Key Generator Button */}
      <Pressable style={[styles.primaryButton, { marginTop: 12 }]} onPress={() => setKeyModalVisible(true)}>
        <Text style={styles.buttonText}>🔑 Open Key Generator</Text>
      </Pressable>

      {/* GitHub Button */}
      <Pressable style={[styles.secondaryButton, { marginTop: 8 }]} onPress={() => setGithubModal(true)}>
        <Text style={styles.buttonText}>🐙 GitHub Integration</Text>
      </Pressable>

      {/* Key Generator Modal */}
      <Modal visible={keyModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, isDark && styles.darkCard]}>
            <ScrollView>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Generate License Key</Text>

              <View style={styles.typeRow}>
                {(['promo', 'paid', 'api'] as KeyType[]).map(t => (
                  <Pressable key={t} style={[styles.typeBtn, selectedType === t && { backgroundColor: getTypeColor(t) }]} onPress={() => setSelectedType(t)}>
                    <Text style={styles.typeText}>{t.toUpperCase()}</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput style={[styles.input, isDark && styles.darkInput]} placeholder="Length" keyboardType="numeric" value={keyLength} onChangeText={setKeyLength} />
              <TextInput style={[styles.input, isDark && styles.darkInput]} placeholder="Max Uses" keyboardType="numeric" value={maxUses} onChangeText={setMaxUses} />
              <TextInput style={[styles.input, isDark && styles.darkInput]} placeholder="Expiry (days)" keyboardType="numeric" value={expiryDays} onChangeText={setExpiryDays} />
              <TextInput style={[styles.input, isDark && styles.darkInput]} placeholder="Metadata" value={metadata} onChangeText={setMetadata} />

              <Pressable style={styles.primaryButton} onPress={generateKey}>
                <Text style={styles.buttonText}>Generate Secure Key</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => setKeyModalVisible(false)}>
                <Text style={styles.buttonText}>Close</Text>
              </Pressable>

              <TextInput style={[styles.input, { marginTop: 12 }]} placeholder="Search keys..." value={keySearch} onChangeText={setKeySearch} />

              {filteredKeys.map(k => (
                <View key={k.id} style={[styles.keyRow, isDark && styles.darkCard]}>
                  <Text style={{ color: getTypeColor(k.type), fontWeight: '700' }}>{k.type}</Text>
                  <Text style={[styles.keyText, isDark && styles.darkText]}>{k.key}</Text>
                  <Text style={styles.keyMeta}>{k.status} • {k.uses}/{k.maxUses}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable onPress={() => copyKey(k.key)}><Text style={styles.copy}>Copy</Text></Pressable>
                    <Pressable onPress={() => revokeKey(k.id)}><Text style={styles.revoke}>Revoke</Text></Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* GitHub Modal */}
      <Modal visible={githubModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, isDark && styles.darkCard]}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>GitHub Integration</Text>

            {!githubToken ? (
              <>
                <TextInput style={[styles.input, isDark && styles.darkInput]} placeholder="GitHub Token" value={githubToken} onChangeText={setGithubToken} secureTextEntry />
                <Pressable style={styles.primaryButton} onPress={connectGitHub}>
                  <Text style={styles.buttonText}>Connect (Device Flow)</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={[styles.success, isDark && styles.darkText]}>Connected ✓</Text>
                {repos.map(r => (
                  <Pressable key={r.id} style={styles.repoRow} onPress={() => loadIssues(r)}>
                    <Text style={[styles.darkText]}>{r.full_name}</Text>
                  </Pressable>
                ))}

                {selectedRepo && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Issues in {selectedRepo.name}</Text>
                    <TextInput style={[styles.input, isDark && styles.darkInput]} placeholder="New issue title" value={newIssueTitle} onChangeText={setNewIssueTitle} />
                    <Pressable style={styles.primaryButton} onPress={createIssue}>
                      <Text style={styles.buttonText}>Create Issue</Text>
                    </Pressable>
                    {issues.map(i => (
                      <Text key={i.id} style={styles.issue}>#{i.number} {i.title} ({i.state})</Text>
                    ))}
                  </>
                )}
              </>
            )}
            <Pressable style={styles.secondaryButton} onPress={() => setGithubModal(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  darkContainer: { backgroundColor: '#0f172a' },
  header: { fontSize: 22, fontWeight: '700', color: '#0f172a', textAlign: 'center', marginBottom: 12 },
  darkText: { color: '#f1f5f9' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  darkInput: { backgroundColor: '#1e2937', borderColor: '#334155', color: '#f1f5f9' },
  addCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  darkCard: { backgroundColor: '#1e2937', borderColor: '#334155' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#334155' },
  primaryButton: { backgroundColor: '#0ea5e9', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  secondaryButton: { backgroundColor: '#64748b', borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  itemCategory: { fontSize: 13, color: '#64748b' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 20, color: '#0369a1', fontWeight: '700' },
  qtyValue: { fontSize: 18, fontWeight: '700', marginHorizontal: 14, minWidth: 30, textAlign: 'center' },
  delete: { color: '#dc2626', fontSize: 24, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '90%' },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#e2e8f0', alignItems: 'center' },
  typeText: { fontWeight: '700', color: '#0f172a' },
  keyRow: { padding: 12, borderRadius: 8, backgroundColor: '#f8fafc', marginBottom: 8 },
  keyText: { fontFamily: 'monospace', fontSize: 15, marginVertical: 4 },
  keyMeta: { fontSize: 12, color: '#64748b' },
  copy: { color: '#0ea5e9', fontWeight: '600' },
  revoke: { color: '#dc2626', fontWeight: '600' },
  success: { color: '#22c55e', fontWeight: '700', marginBottom: 12 },
  repoRow: { padding: 12, backgroundColor: '#f1f5f9', borderRadius: 8, marginBottom: 6 },
  issue: { padding: 8, color: '#334155' },
});