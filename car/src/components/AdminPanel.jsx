import { useState, useEffect, useCallback } from 'react';
import {
  X, ClipboardList, Wrench, Trash2, Plus, Pencil, Check, ChevronDown,
  RefreshCw, AlertCircle, FileText
} from 'lucide-react';
import { manufacturers, getModelsForManufacturer, getYears, getDetailedModelsForModel } from '../data/mockData';
import './AdminPanel.css';

const CATEGORIES = [
  { value: 'engine', label: '엔진 케어' },
  { value: 'brake', label: '브레이크' },
  { value: 'transmission', label: '미션 / 변속기' },
  { value: 'filter', label: '필터 교체' },
  { value: 'battery', label: '배터리' },
  { value: 'inspection', label: '점검 서비스' },
  { value: 'other', label: '기타' },
];

const categoryLabel = (val) => CATEGORIES.find(c => c.value === val)?.label || val;

// ─── Sub-component: Reservations Tab ────────────────────────
const ReservationsTab = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingIdx, setConfirmingIdx] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/reservations');
    const data = await res.json();
    setReservations(data);
    setLoading(false);
    setConfirmingIdx(null);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (idx) => {
    if (confirmingIdx !== idx) {
      setConfirmingIdx(idx);
      return;
    }

    try {
      const res = await fetch(`/api/reservations/${idx}`, { method: 'DELETE' });
      if (res.ok) {
        alert('예약이 삭제되었습니다.');
        fetchData();
      } else {
        const err = await res.json();
        alert(`삭제 실패: ${err.error || '알 수 없는 오류'}`);
      }
    } catch (e) {
      alert(`네트워크 오류: ${e.message}`);
    }
  };

  if (loading) return <div className="admin-loading"><RefreshCw size={20} className="spin"/>불러오는 중...</div>;

  return (
    <div className="admin-tab-content">
      <div className="tab-toolbar">
        <h3>총 {reservations.length}건의 예약 내역</h3>
        <button className="icon-btn" onClick={fetchData}><RefreshCw size={16}/> 새로고침</button>
      </div>

      {reservations.length === 0 ? (
        <div className="empty-state">
          <AlertCircle size={40}/>
          <p>아직 예약 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="reservations-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>예약 일시</th>
                <th>고객 정보</th>
                <th>차량</th>
                <th>선택 항목</th>
                <th>견적 금액</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r, i) => (
                <tr key={i}>
                  <td className="row-num">{i + 1}</td>
                  <td className="cell-date">{r['예약일시']}</td>
                  <td className="cell-customer"><strong>{r['고객명/연락처']}</strong></td>
                  <td className="cell-car">{r['예약차량상세']}</td>
                  <td className="cell-items">
                    {(r['선택정비항목'] || '').split(' | ').filter(Boolean).map((item, j) => (
                      <span key={j} className="item-badge">{item}</span>
                    ))}
                  </td>
                  <td className="cell-total"><strong>{r['총견적금액']}</strong></td>
                  <td>
                    <button
                      className={`icon-btn danger ${confirmingIdx === i ? 'confirming' : ''}`}
                      onClick={() => handleDelete(i)}
                      onMouseLeave={() => setConfirmingIdx(null)}
                    >
                      {confirmingIdx === i ? <><Check size={14}/> 정말 삭제?</> : <Trash2 size={15}/>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Sub-component: Products Tab ─────────────────────────────
const EMPTY_FORM = { category: 'engine', name: '', price: '', '브랜드': '', '차종': '', '연식': '', '세부모델': '' };

const ProductsTab = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmingId, setConfirmingId] = useState(null);

  const getBrandIdByName = (name) => {
    return manufacturers.find(m => m.name === name)?.id || null;
  };

  const getModelIdByName = (brandName, modelName) => {
    const brandId = getBrandIdByName(brandName);
    if (!brandId) return null;
    return getModelsForManufacturer(brandId).find(m => m.name === modelName)?.id || null;
  };

  const addFormBrandId = getBrandIdByName(addForm['브랜드']);
  const addFormModels = addFormBrandId ? getModelsForManufacturer(addFormBrandId) : [];
  
  const addFormModelId = getModelIdByName(addForm['브랜드'], addForm['차종']);
  const addFormDetailedModels = addFormModelId ? getDetailedModelsForModel(addFormModelId) : [];

  const editFormBrandId = getBrandIdByName(editForm['브랜드']);
  const editFormModels = editFormBrandId ? getModelsForManufacturer(editFormBrandId) : [];
  
  const editFormModelId = getModelIdByName(editForm['브랜드'], editForm['차종']);
  const editFormDetailedModels = editFormModelId ? getDetailedModelsForModel(editFormModelId) : [];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (e) { console.error(e); }
    setLoading(false);
    setConfirmingId(null);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 📥 Export data to CSV (Excel compatible)
  const handleDownloadCsv = () => {
    if (products.length === 0) {
      alert('내보낼 정비 항목 데이터가 없습니다.');
      return;
    }
    const headers = ['id', '브랜드', '차종', '연식', '세부모델', 'category', 'name', 'price'];
    const csvRows = [
      headers.join(','),
      ...products.map(p => [
        p.id || '',
        `"${(p['브랜드'] || '').replace(/"/g, '""')}"`,
        `"${(p['차종'] || '').replace(/"/g, '""')}"`,
        p['연식'] || '',
        `"${(p['세부모델'] || '').replace(/"/g, '""')}"`,
        p.category || '',
        `"${(p.name || '').replace(/"/g, '""')}"`,
        p.price || 0
      ].join(','))
    ];
    
    // Prefix UTF-8 Byte Order Mark (\ufeff) to prevent Korean encoding issues in Excel
    const csvContent = '\ufeff' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'THEO_MOTORS_정비항목.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 📤 Batch upload data from CSV (Excel compatible)
  const handleUploadCsv = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          alert('업로드된 파일에 유효한 데이터 행이 없습니다.');
          return;
        }
        
        // CSV row parser handling quotes & escaped quotes correctly
        const parseCsvRow = (rowText) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < rowText.length; i++) {
            const char = rowText[i];
            if (char === '"') {
              if (inQuotes && rowText[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };
        
        const rawHeaders = parseCsvRow(lines[0]);
        const headers = rawHeaders.map(h => h.replace(/^\ufeff/, '').trim()); // Strip BOM
        
        const categoryIdx = headers.findIndex(h => h.toLowerCase() === 'category');
        const nameIdx = headers.findIndex(h => h.toLowerCase() === 'name');
        const priceIdx = headers.findIndex(h => h.toLowerCase() === 'price');
        const brandIdx = headers.findIndex(h => h === '브랜드' || h.toLowerCase() === 'brand');
        const modelIdx = headers.findIndex(h => h === '차종' || h.toLowerCase() === 'model');
        const yearIdx = headers.findIndex(h => h === '연식' || h.toLowerCase() === 'year');
        const detailedModelIdx = headers.findIndex(h => h === '세부모델' || h.toLowerCase() === 'detailedmodel');
        
        if (nameIdx === -1 || priceIdx === -1) {
          alert('필수 컬럼(name, price) 헤더가 파일에 존재하지 않습니다.');
          return;
        }
        
        const parsedItems = [];
        for (let i = 1; i < lines.length; i++) {
          const columns = parseCsvRow(lines[i]);
          if (columns.length < 2) continue;
          
          const name = columns[nameIdx];
          if (!name) continue;
          
          parsedItems.push({
            '브랜드': brandIdx !== -1 ? columns[brandIdx] : '',
            '차종': modelIdx !== -1 ? columns[modelIdx] : '',
            '연식': yearIdx !== -1 ? columns[yearIdx] : '',
            '세부모델': detailedModelIdx !== -1 ? columns[detailedModelIdx] : '',
            category: categoryIdx !== -1 ? columns[categoryIdx] : 'other',
            name: name,
            price: priceIdx !== -1 ? columns[priceIdx] : '0'
          });
        }
        
        if (parsedItems.length === 0) {
          alert('가져올 유효한 정비 항목 데이터가 존재하지 않습니다.');
          return;
        }
        
        const confirmMsg = `총 ${parsedItems.length}건의 정비 항목을 일괄 업로드하여 기존 데이터를 모두 덮어쓰시겠습니까?\n\n※ 업로드 전 기존 데이터는 서버에 자동으로 백업됩니다.`;
        if (!window.confirm(confirmMsg)) return;
        
        const response = await fetch('/api/products/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedItems)
        });
        
        if (response.ok) {
          alert('🎉 정비 항목 일괄 업로드가 성공적으로 완료되었습니다!');
          fetchData();
        } else {
          const errorData = await response.json();
          alert(`❌ 일괄 업로드 실패: ${errorData.error || '알 수 없는 오류'}`);
        }
      } catch (err) {
        console.error('Import CSV parsing error:', err);
        alert(`❌ CSV 데이터 파싱 오류: ${err.message}`);
      }
    };
    reader.readAsText(file, 'UTF-8');
    
    // Reset file input value so same file can be selected again
    e.target.value = '';
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.price) { alert('이름과 가격을 입력해주세요.'); return; }
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    setAddForm(EMPTY_FORM);
    setShowAddForm(false);
    fetchData();
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({ ...p });
  };

  const saveEdit = async () => {
    await fetch(`/api/products/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('항목이 삭제되었습니다.');
        fetchData();
      } else {
        const err = await res.json();
        alert(`삭제 실패: ${err.error || '알 수 없는 오류'}`);
      }
    } catch (e) {
      alert(`네트워크 오류: ${e.message}`);
    }
  };

  if (loading) return <div className="admin-loading"><RefreshCw size={20} className="spin"/>불러오는 중...</div>;

  return (
    <div className="admin-tab-content">
      <div className="tab-toolbar">
        <h3>정비 항목 관리 ({products.length}건)</h3>
        <div className="toolbar-actions">
          <button className="icon-btn" onClick={fetchData}><RefreshCw size={16}/> 새로고침</button>
          <button className="icon-btn excel-download-btn" onClick={handleDownloadCsv}>
            <FileText size={16}/> 엑셀 다운로드
          </button>
          <label className="icon-btn excel-upload-btn" style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center' }}>
            <Plus size={16}/> 엑셀 일괄 업로드
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleUploadCsv} 
              style={{ display: 'none' }} 
            />
          </label>
          <button className="btn-primary add-btn" onClick={() => setShowAddForm(v => !v)}>
            <Plus size={16}/> 개별 항목 추가
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-form-card">
          <h4>새 정비 항목 등록</h4>
          <div className="form-column">
            {/* First Row: Vehicle Setup */}
            <div className="form-row">
              <div className="form-group">
                <label>브랜드</label>
                <select value={addForm['브랜드'] || ''} onChange={e => {
                  const val = e.target.value;
                  setAddForm({ ...addForm, '브랜드': val, '차종': '', '세부모델': '' });
                }}>
                  <option value="">공용 (전체 브랜드)</option>
                  {manufacturers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>차종</label>
                <select value={addForm['차종'] || ''} disabled={!addForm['브랜드']} onChange={e => {
                  const val = e.target.value;
                  setAddForm({ ...addForm, '차종': val, '세부모델': '' });
                }}>
                  <option value="">공용 (전체 차종)</option>
                  {addFormModels.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>연식</label>
                <select value={addForm['연식'] || ''} onChange={e => setAddForm({ ...addForm, '연식': e.target.value })}>
                  <option value="">공용 (전체 연식)</option>
                  {getYears().map(y => <option key={y} value={String(y)}>{y}년형</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>세부모델</label>
                <select value={addForm['세부모델'] || ''} disabled={!addForm['차종']} onChange={e => setAddForm({ ...addForm, '세부모델': e.target.value })}>
                  <option value="">공용 (전체 세부모델)</option>
                  {addFormDetailedModels.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
            </div>

            {/* Second Row: Service Setup */}
            <div className="form-row">
              <div className="form-group">
                <label>카테고리</label>
                <select value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group grow">
                <label>항목명</label>
                <input type="text" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} placeholder="예: 엔진오일 교환"/>
              </div>
              <div className="form-group">
                <label>가격(원)</label>
                <input type="number" value={addForm.price} onChange={e => setAddForm({ ...addForm, price: e.target.value })} placeholder="0"/>
              </div>
              <button className="btn-primary" onClick={handleAdd} style={{marginTop: '24px'}}><Check size={16}/> 등록</button>
            </div>
          </div>
        </div>
      )}

      <div className="products-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>카테고리</th>
              <th>적용 차량</th>
              <th>항목명</th>
              <th>가격</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const carText = [p['브랜드'], p['차종'], p['연식'] ? `${p['연식']}년형` : '', p['세부모델']].filter(Boolean).join(' · ');
              const isEditing = editingId === p.id;
              return (
                <tr key={p.id} className={isEditing ? 'editing-row' : ''}>
                  <td>
                    {isEditing ? (
                      <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    ) : (
                      <span className="category-badge">{categoryLabel(p.category)}</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className="admin-inline-car-edit" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <select 
                          value={editForm['브랜드'] || ''} 
                          style={{ padding: '4px', fontSize: '12px' }}
                          onChange={e => {
                            const val = e.target.value;
                            setEditForm({ 
                              ...editForm, 
                              '브랜드': val, 
                              '차종': '', 
                              '세부모델': '' 
                            });
                          }}
                        >
                          <option value="">전체 브랜드</option>
                          {manufacturers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                        <select 
                          value={editForm['차종'] || ''} 
                          disabled={!editForm['브랜드']}
                          style={{ padding: '4px', fontSize: '12px' }}
                          onChange={e => {
                            const val = e.target.value;
                            setEditForm({ 
                              ...editForm, 
                              '차종': val, 
                              '세부모델': '' 
                            });
                          }}
                        >
                          <option value="">전체 차종</option>
                          {editFormModels.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                        <select 
                          value={editForm['연식'] || ''} 
                          style={{ padding: '4px', fontSize: '12px' }}
                          onChange={e => setEditForm({ ...editForm, '연식': e.target.value })}
                        >
                          <option value="">전체 연식</option>
                          {getYears().map(y => <option key={y} value={String(y)}>{y}년형</option>)}
                        </select>
                        <select 
                          value={editForm['세부모델'] || ''} 
                          disabled={!editForm['차종']}
                          style={{ padding: '4px', fontSize: '12px' }}
                          onChange={e => setEditForm({ ...editForm, '세부모델': e.target.value })}
                        >
                          <option value="">전체 세부모델</option>
                          {editFormDetailedModels.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                      </div>
                    ) : (
                      carText ? (
                        <span className="car-target-badge">{carText}</span>
                      ) : (
                        <span className="car-target-badge common">공용 (전체 차량)</span>
                      )
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="inline-input"/>
                    ) : (
                      p.name
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} className="inline-input price-input"/>
                    ) : (
                      <strong className="text-primary">{parseInt(p.price).toLocaleString()}원</strong>
                    )}
                  </td>
                  <td className="cell-actions">
                    {isEditing ? (
                      <>
                        <button className="icon-btn success" onClick={saveEdit}><Check size={15}/></button>
                        <button className="icon-btn" onClick={() => setEditingId(null)}><X size={15}/></button>
                      </>
                    ) : (
                      <>
                        <button className="icon-btn" onClick={() => startEdit(p)}><Pencil size={15}/></button>
                        <button
                          className={`icon-btn danger ${confirmingId === p.id ? 'confirming' : ''}`}
                          onClick={() => handleDelete(p.id)}
                          onMouseLeave={() => setConfirmingId(null)}
                        >
                          {confirmingId === p.id ? <><Check size={14}/> 정말 삭제?</> : <Trash2 size={15}/>}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Sub-component: Posts Tab ────────────────────────────────
const PostsTab = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', content: '', isPopup: false });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmingId, setConfirmingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/posts');
    const data = await res.json();
    setPosts(data);
    setLoading(false);
    setConfirmingId(null);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }

    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('게시물이 삭제되었습니다.');
        fetchData();
      } else {
        const err = await res.json();
        alert(`삭제 실패: ${err.error || '알 수 없는 오류'}`);
      }
    } catch (e) {
      alert(`네트워크 오류: ${e.message}`);
    }
  };

  const startEdit = (post) => {
    setEditingId(post.id);
    setEditForm({ ...post });
  };

  const saveEdit = async () => {
    await fetch(`/api/posts/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    fetchData();
  };

  const handleAdd = async () => {
    if (!addForm.title || !addForm.content) { alert('제목과 내용을 입력해주세요.'); return; }
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    setAddForm({ title: '', content: '', isPopup: false });
    setShowAddForm(false);
    fetchData();
  };

  if (loading) return <div className="admin-loading"><RefreshCw size={20} className="spin"/>불러오는 중...</div>;

  return (
    <div className="admin-tab-content">
      <div className="tab-toolbar">
        <h3>게시물 관리 ({posts.length}건)</h3>
        <div className="toolbar-actions">
          <button className="icon-btn" onClick={fetchData}><RefreshCw size={16}/> 새로고침</button>
          <button className="btn-primary add-btn" onClick={() => setShowAddForm(v => !v)}>
            <Plus size={16}/> 새 게시물
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-form-card">
          <h4>새 공지사항 등록</h4>
          <div className="form-column">
            <div className="form-group full-width">
              <label>제목</label>
              <input type="text" value={addForm.title} onChange={e => setAddForm({ ...addForm, title: e.target.value })} placeholder="제목을 입력하세요"/>
            </div>
            <div className="form-group full-width">
              <label>내용</label>
              <textarea rows="4" value={addForm.content} onChange={e => setAddForm({ ...addForm, content: e.target.value })} placeholder="내용을 입력하세요" className="admin-textarea"/>
            </div>
            <div className="form-actions-between">
              <label className="checkbox-label">
                <input type="checkbox" checked={addForm.isPopup} onChange={e => setAddForm({ ...addForm, isPopup: e.target.checked })} />
                <span>접속 시 팝업으로 띄우기</span>
              </label>
              <button className="btn-primary" onClick={handleAdd}><Check size={16}/> 등록하기</button>
            </div>
          </div>
        </div>
      )}

      <div className="posts-list">
        {posts.map((p) => (
          <div key={p.id} className={`post-admin-card ${editingId === p.id ? 'editing' : ''}`}>
            <div className="post-admin-header">
              {editingId === p.id ? (
                <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="inline-input title-input"/>
              ) : (
                <div className="post-admin-title-wrap">
                  <span className="post-admin-title">{p.title}</span>
                  {p.isPopup === 'true' && <span className="popup-active-badge">팝업 활성</span>}
                </div>
              )}
              <span className="post-admin-date">{p.date}</span>
            </div>
            <div className="post-admin-body">
              {editingId === p.id ? (
                <textarea rows="3" value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} className="inline-input content-textarea"/>
              ) : (
                <p className="post-admin-text">{p.content}</p>
              )}
            </div>
            <div className="post-admin-footer">
              {editingId === p.id ? (
                <>
                  <label className="checkbox-label mr-auto">
                    <input type="checkbox" checked={editForm.isPopup === 'true' || editForm.isPopup === true} onChange={e => setEditForm({ ...editForm, isPopup: e.target.checked })} />
                    <span>팝업 설정</span>
                  </label>
                  <button className="icon-btn success" onClick={saveEdit}><Check size={15}/> 저장</button>
                  <button className="icon-btn" onClick={() => setEditingId(null)}><X size={15}/> 취소</button>
                </>
              ) : (
                <>
                  <button className="icon-btn" onClick={() => startEdit(p)}><Pencil size={15}/> 수정</button>
                  <button
                    className={`icon-btn danger ${confirmingId === p.id ? 'confirming' : ''}`}
                    onClick={() => handleDelete(p.id)}
                    onMouseLeave={() => setConfirmingId(null)}
                  >
                    {confirmingId === p.id ? <><Check size={14}/> 정말 삭제?</> : <Trash2 size={15}/>}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main AdminPanel Component ───────────────────────────────
const AdminPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('reservations');

  return (
    <div className="admin-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-panel">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-title">
            <div className="admin-badge">ADMIN</div>
            <h2>관리자 대시보드</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X size={22}/></button>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab-btn ${activeTab === 'reservations' ? 'active' : ''}`}
            onClick={() => setActiveTab('reservations')}
          >
            <ClipboardList size={17}/> 예약 내역
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Wrench size={17}/> 정비 항목 관리
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <FileText size={17}/> 게시물 관리
          </button>
        </div>

        {/* Tab Body */}
        <div className="admin-body">
          {activeTab === 'reservations' ? <ReservationsTab /> :
           activeTab === 'products' ? <ProductsTab /> :
           <PostsTab />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
