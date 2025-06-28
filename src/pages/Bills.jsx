import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = 'https://ti054c04.agussbn.my.id/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function Bills() {
  const [open, setOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [formData, setFormData] = useState({
    nim: '',
    kategori_ukt_id: '',
    semester: '',
    tahun_akademik: '',
    tanggal_jatuh_tempo: '',
    nominal: '',
    status_pembayaran: 'belum_lunas',
    keterangan: '',
  });

  const queryClient = useQueryClient();

  const { data: billsRaw, isLoading: billsLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/tagihan`, { headers: getAuthHeaders() });
      console.log('API /tagihan response:', response.data);
      if (Array.isArray(response.data.data)) return response.data.data;
      if (Array.isArray(response.data.data?.data)) return response.data.data.data;
      return [];
    },
  });
  const bills = Array.isArray(billsRaw) ? billsRaw : [];

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/masters`, { headers: getAuthHeaders() });
      return response.data.data || [];
    },
  });

  const { data: categoriesRaw = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['uktCategories'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/kategori-ukt`, { headers: getAuthHeaders() });
      console.log('API /kategori-ukt response:', response.data);
      if (Array.isArray(response.data.data)) return response.data.data;
      if (Array.isArray(response.data.data?.data)) return response.data.data.data;
      return [];
    },
  });
  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];

  const createMutation = useMutation({
    mutationFn: async (newBill) => {
      const response = await axios.post(`${API_URL}/tagihan`, newBill, { headers: getAuthHeaders() });
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Gagal membuat tagihan.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bills']);
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedBill) => {
      const response = await axios.put(
        `${API_URL}/tagihan/${updatedBill.id_tagihan}`,
        updatedBill,
        { headers: getAuthHeaders() }
      );
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Gagal mengupdate tagihan.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bills']);
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id_tagihan) => {
      const response = await axios.delete(`${API_URL}/tagihan/${id_tagihan}`, { headers: getAuthHeaders() });
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Gagal menghapus tagihan.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bills']);
    },
  });

  const generateBillsMutation = useMutation({
    mutationFn: async (semester) => {
      const response = await axios.post(`${API_URL}/tagihan/generate`, {
        semester,
      }, { headers: getAuthHeaders() });
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Gagal men-generate tagihan.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bills']);
    },
  });

  const handleOpen = (bill = null) => {
    if (bill) {
      setSelectedBill(bill);
      setFormData({
        nim: bill.nim,
        kategori_ukt_id: bill.kategori_ukt_id || '',
        semester: bill.semester || '',
        tahun_akademik: bill.tahun_akademik || '',
        tanggal_jatuh_tempo: format(
          new Date(bill.tanggal_jatuh_tempo),
          'yyyy-MM-dd'
        ),
        nominal: bill.nominal,
        status_pembayaran: bill.status_pembayaran || 'belum_lunas',
        keterangan: bill.keterangan || '',
      });
    } else {
      setSelectedBill(null);
      setFormData({
        nim: '',
        kategori_ukt_id: '',
        semester: '',
        tahun_akademik: '',
        tanggal_jatuh_tempo: '',
        nominal: '',
        status_pembayaran: 'belum_lunas',
        keterangan: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedBill(null);
    setFormData({
      nim: '',
      kategori_ukt_id: '',
      semester: '',
      tahun_akademik: '',
      tanggal_jatuh_tempo: '',
      nominal: '',
      status_pembayaran: 'belum_lunas',
      keterangan: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedStudent = students?.find(
      (student) => student.nim === formData.nim
    );

    if (!selectedStudent) {
      // Ideally, set an error state here to inform the user
      console.error('Selected student not found!');
      return;
    }

    const dataToSubmit = {
      user_id: selectedStudent.user_id,
      nim: selectedStudent.nim,
      kategori_ukt_id: Number(formData.kategori_ukt_id),
      semester: Number(formData.semester),
      tahun_akademik: formData.tahun_akademik,
      nominal: Number(formData.nominal),
      tanggal_jatuh_tempo: formData.tanggal_jatuh_tempo,
      status_pembayaran: formData.status_pembayaran,
      keterangan: formData.keterangan,
    };

    if (selectedBill) {
      updateMutation.mutate({
        id_tagihan: selectedBill.id_tagihan,
        ...dataToSubmit,
      });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleGenerateBills = () => {
    const semester = prompt('Enter semester (e.g., 2023/2024-1):');
    if (semester) {
      generateBillsMutation.mutate(semester);
    }
  };

  const columns = [
    { field: 'id_tagihan', headerName: 'ID', width: 90 },
    {
      field: 'nim',
      headerName: 'NIM',
      width: 200,
      valueGetter: (params) => {
        const student = students?.find((s) => s.nim === params.row.nim);
        return student ? `${params.row.nim} - ${student.nama}` : params.row.nim;
      },
    },
    { field: 'semester', headerName: 'Semester', width: 100 },
    { field: 'tahun_akademik', headerName: 'Tahun Akademik', width: 150 },
    {
      field: 'tanggal_jatuh_tempo',
      headerName: 'Tanggal Jatuh Tempo',
      width: 130,
      valueFormatter: (params) => {
        return format(new Date(params.value), 'dd/MM/yyyy');
      },
    },
    {
      field: 'nominal',
      headerName: 'Nominal',
      width: 150,
      valueFormatter: (params) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
        }).format(params.value);
      },
    },
    {
      field: 'status_pembayaran',
      headerName: 'Status Pembayaran',
      width: 130,
      renderCell: (params) => (
        <Box
          sx={{
            backgroundColor:
              params.value === 'lunas' ? '#4caf50' : '#f44336',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          {params.value}
        </Box>
      ),
    },
    { field: 'keterangan', headerName: 'Keterangan', width: 200 },
    {
      field: 'actions',
      headerName: 'Aksi',
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" onClick={() => handleOpen(params.row)}>
            Edit
          </Button>
          <Button size="small" color="error" onClick={() => deleteMutation.mutate(params.row.id_tagihan)}>
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Tuition Bills</Typography>
        <Box>
          <Button
            variant="contained"
            onClick={handleGenerateBills}
            sx={{ mr: 2 }}
          >
            Generate Bills
          </Button>
          <Button variant="contained" onClick={() => handleOpen()}>
            Add New Bill
          </Button>
        </Box>
      </Box>

      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={bills}
          columns={columns}
          loading={billsLoading || studentsLoading || categoriesLoading}
          getRowId={(row) => row.id_tagihan}
          pageSize={5}
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {selectedBill ? 'Edit Bill' : 'Add New Bill'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="dense">
              <InputLabel>NIM</InputLabel>
              <Select
                value={formData.nim}
                label="NIM"
                onChange={(e) =>
                  setFormData({ ...formData, nim: e.target.value })
                }
                required
              >
                {students?.map((student) => (
                  <MenuItem key={student.nim} value={student.nim}>
                    {student.nim} - {student.nama}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Kategori</InputLabel>
              <Select
                value={formData.kategori_ukt_id}
                label="Kategori"
                onChange={(e) =>
                  setFormData({ ...formData, kategori_ukt_id: e.target.value })
                }
                required
              >
                {categories.length === 0 && (
                  <MenuItem disabled value="">
                    Tidak ada data kategori UKT
                  </MenuItem>
                )}
                {categories.map((category, idx) => (
                  <MenuItem
                    key={category.id_kategori_ukt ?? category.id ?? idx}
                    value={category.id_kategori_ukt ?? category.id ?? ''}
                  >
                    {category.nama_kategori ?? category.nama ?? 'Tanpa Nama'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Semester"
              type="text"
              fullWidth
              value={formData.semester}
              onChange={(e) =>
                setFormData({ ...formData, semester: e.target.value })
              }
              required
            />
            <TextField
              margin="dense"
              label="Tahun Akademik"
              type="text"
              fullWidth
              value={formData.tahun_akademik}
              onChange={(e) =>
                setFormData({ ...formData, tahun_akademik: e.target.value })
              }
              required
            />
            <TextField
              margin="dense"
              label="Tanggal Jatuh Tempo"
              type="date"
              fullWidth
              value={formData.tanggal_jatuh_tempo}
              onChange={(e) =>
                setFormData({ ...formData, tanggal_jatuh_tempo: e.target.value })
              }
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              margin="dense"
              label="Amount"
              type="number"
              fullWidth
              value={formData.nominal}
              onChange={(e) =>
                setFormData({ ...formData, nominal: e.target.value })
              }
              required
              InputProps={{
                startAdornment: 'Rp ',
              }}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Status Pembayaran</InputLabel>
              <Select
                value={formData.status_pembayaran}
                label="Status Pembayaran"
                onChange={(e) =>
                  setFormData({ ...formData, status_pembayaran: e.target.value })
                }
              >
                <MenuItem value="belum_lunas">belum_lunas</MenuItem>
                <MenuItem value="lunas">lunas</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Keterangan"
              type="text"
              fullWidth
              value={formData.keterangan}
              onChange={(e) =>
                setFormData({ ...formData, keterangan: e.target.value })
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedBill ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default Bills; 