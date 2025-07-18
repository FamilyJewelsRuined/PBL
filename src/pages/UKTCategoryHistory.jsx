import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  InputAdornment,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Add as AddIcon, History as HistoryIcon, Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import uktCategoryHistoryService from '../services/uktCategoryHistory';

function UKTCategoryHistory() {
  const [open, setOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [formData, setFormData] = useState({
    nim: '',
    id_kategori_ukt: '',
    tanggal_perubahan: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filterNIM, setFilterNIM] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const queryClient = useQueryClient();

  // Fetch UKT category history
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['uktCategoryHistory'],
    queryFn: uktCategoryHistoryService.getAllHistory,
  });

  // Fetch students for dropdown
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await fetch('https://ti054c04.agussbn.my.id/api/masters', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      return data.data || [];
    },
  });

  // Fetch UKT categories for dropdown
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['uktCategories'],
    queryFn: async () => {
      const response = await fetch('https://ti054c04.agussbn.my.id/api/kategori-ukt', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      return data.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: uktCategoryHistoryService.createHistory,
    onSuccess: () => {
      queryClient.invalidateQueries(['uktCategoryHistory']);
      handleClose();
      setSuccess('Riwayat kategori UKT berhasil ditambahkan');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      console.error('Create history error:', err);
      if (err.response && err.response.data) {
        const data = err.response.data;
        let msg = '';
        if (data.errors) {
          msg = Object.values(data.errors).flat().join(' | ');
        } else if (data.message) {
          msg =
            typeof data.message === 'object'
              ? Object.values(data.message).flat().join(' | ')
              : data.message;
        } else {
          msg = JSON.stringify(data);
        }
        setError('Gagal menambah riwayat: ' + msg);
      } else {
        setError(`Gagal menambah riwayat: ${err.message}`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: uktCategoryHistoryService.deleteHistory,
    onSuccess: () => {
      queryClient.invalidateQueries(['uktCategoryHistory']);
      setSuccess('Riwayat kategori UKT berhasil dihapus');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError('Gagal menghapus riwayat.');
    },
  });

  const handleOpen = (history = null) => {
    setError('');
    if (history) {
      setSelectedHistory(history);
      setFormData({
        nim: history.nim,
        id_kategori_ukt: history.id_kategori_ukt,
        tanggal_perubahan: history.tanggal_perubahan,
      });
    } else {
      setSelectedHistory(null);
      setFormData({
        nim: '',
        id_kategori_ukt: '',
        tanggal_perubahan: new Date().toISOString().split('T')[0],
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedHistory(null);
    setFormData({
      nim: '',
      id_kategori_ukt: '',
      tanggal_perubahan: new Date().toISOString().split('T')[0],
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const data = {
      ...formData,
      id_kategori_ukt: parseInt(formData.id_kategori_ukt),
    };

    createMutation.mutate(data);
  };

  // Helper function to get student name by NIM
  const getStudentName = (nim) => {
    const student = students?.find(s => s.nim === nim);
    return student ? student.nama : nim;
  };

  // Helper function to get category name by ID
  const getCategoryName = (id) => {
    const category = categories?.find(c => c.id_kategori_ukt === id);
    return category ? category.nama_kategori : id;
  };

  // Filter data based on search and filters
  const filteredData = historyData?.filter((item) => {
    const matchesSearch = searchText === '' || 
      item.nim.toLowerCase().includes(searchText.toLowerCase()) ||
      getStudentName(item.nim).toLowerCase().includes(searchText.toLowerCase()) ||
      getCategoryName(item.id_kategori_ukt).toLowerCase().includes(searchText.toLowerCase());
    
    const matchesNIM = filterNIM === '' || item.nim === filterNIM;
    const matchesCategory = filterCategory === '' || item.id_kategori_ukt.toString() === filterCategory;
    
    return matchesSearch && matchesNIM && matchesCategory;
  }) || [];

  const columns = [
    { 
      field: 'id_riwayat', 
      headerName: 'ID Riwayat', 
      width: 120 
    },
    { 
      field: 'nim', 
      headerName: 'NIM', 
      width: 130 
    },
    { 
      field: 'nama_mahasiswa', 
      headerName: 'Nama Mahasiswa', 
      width: 200,
      valueGetter: (params) => getStudentName(params.row.nim),
    },
    { 
      field: 'id_kategori_ukt', 
      headerName: 'ID Kategori', 
      width: 120 
    },
    { 
      field: 'nama_kategori', 
      headerName: 'Nama Kategori', 
      width: 200,
      valueGetter: (params) => getCategoryName(params.row.id_kategori_ukt),
    },
    {
      field: 'tanggal_perubahan',
      headerName: 'Tanggal Perubahan',
      width: 150,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Button
            size="small"
            color="error"
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin menghapus riwayat ini?')) {
                deleteMutation.mutate(params.row.id_riwayat);
              }
            }}
          >
            Hapus
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          <Typography variant="h5">Riwayat Kategori UKT</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Tambah Riwayat
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Search and Filter Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Cari berdasarkan NIM, nama mahasiswa, atau kategori..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter NIM</InputLabel>
              <Select
                value={filterNIM}
                label="Filter NIM"
                onChange={(e) => setFilterNIM(e.target.value)}
              >
                <MenuItem value="">Semua NIM</MenuItem>
                {students?.map((student) => (
                  <MenuItem key={student.nim} value={student.nim}>
                    {student.nim} - {student.nama}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter Kategori</InputLabel>
              <Select
                value={filterCategory}
                label="Filter Kategori"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="">Semua Kategori</MenuItem>
                {categories?.map((category) => (
                  <MenuItem key={category.id_kategori_ukt} value={category.id_kategori_ukt.toString()}>
                    {category.nama_kategori}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => {
                setSearchText('');
                setFilterNIM('');
                setFilterCategory('');
              }}
            >
              Reset Filter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={filteredData}
          columns={columns}
          loading={isLoading || studentsLoading || categoriesLoading}
          getRowId={(row) => row.id_riwayat}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #e0e0e0',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
            },
          }}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedHistory ? 'Edit Riwayat Kategori UKT' : 'Tambah Riwayat Kategori UKT'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Mahasiswa</InputLabel>
              <Select
                value={formData.nim}
                label="Mahasiswa"
                onChange={(e) =>
                  setFormData({ ...formData, nim: e.target.value })
                }
                disabled={studentsLoading}
              >
                {students?.map((student) => (
                  <MenuItem key={student.nim} value={student.nim}>
                    {student.nim} - {student.nama}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="dense" required>
              <InputLabel>Kategori UKT</InputLabel>
              <Select
                value={formData.id_kategori_ukt}
                label="Kategori UKT"
                onChange={(e) =>
                  setFormData({ ...formData, id_kategori_ukt: e.target.value })
                }
                disabled={categoriesLoading}
              >
                {categories?.map((category) => (
                  <MenuItem key={category.id_kategori_ukt} value={category.id_kategori_ukt}>
                    {category.nama_kategori} - {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                    }).format(category.nominal)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              margin="dense"
              label="Tanggal Perubahan"
              type="date"
              fullWidth
              value={formData.tanggal_perubahan}
              onChange={(e) =>
                setFormData({ ...formData, tanggal_perubahan: e.target.value })
              }
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Batal</Button>
            <Button type="submit" variant="contained">
              {selectedHistory ? 'Update' : 'Tambah'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default UKTCategoryHistory;
