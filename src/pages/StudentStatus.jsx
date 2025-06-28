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
import logStatusMahasiswaService from '../services/logStatusMahasiswa';
import { format } from 'date-fns';

const API_URL = 'https://ti054c04.agussbn.my.id/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function StudentStatus() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nim: '',
    status_awal: '',
    status_baru: '',
  });

  const queryClient = useQueryClient();

  const { data: statusLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['statusLogs'],
    queryFn: async () => {
      return await logStatusMahasiswaService.getAll();
    },
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/masters`, { headers: getAuthHeaders() });
      return response.data.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newLog) => {
      return await logStatusMahasiswaService.create({
        ...newLog,
        tanggal_perubahan: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['statusLogs']);
      queryClient.invalidateQueries(['students']);
      handleClose();
    },
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      nim: '',
      status_awal: '',
      status_baru: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      tanggal_perubahan: new Date().toISOString(),
    });
  };

  const columns = [
    { field: 'id_log', headerName: 'ID', width: 90 },
    {
      field: 'nim',
      headerName: 'NIM',
      width: 130,
    },
    {
      field: 'status_awal',
      headerName: 'Previous Status',
      width: 150,
      renderCell: (params) => (
        <Box
          sx={{
            backgroundColor: params.value === 'AKTIF' ? '#4caf50' : '#f44336',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: 'status_baru',
      headerName: 'New Status',
      width: 150,
      renderCell: (params) => (
        <Box
          sx={{
            backgroundColor: params.value === 'AKTIF' ? '#4caf50' : '#f44336',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: 'tanggal_perubahan',
      headerName: 'Change Date',
      width: 150,
      valueFormatter: (params) => {
        return format(new Date(params.value), 'dd/MM/yyyy HH:mm');
      },
    },
  ];

  console.log(statusLogs);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Student Status History</Typography>
        <Button variant="contained" onClick={handleOpen}>
          Add Status Change
        </Button>
      </Box>

      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={statusLogs || []}
          columns={columns}
          loading={logsLoading || studentsLoading}
          pageSize={5}
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add Status Change</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="dense">
              <InputLabel>Student</InputLabel>
              <Select
                value={formData.nim}
                label="Student"
                onChange={(e) => {
                  const student = students?.find((s) => s.nim === e.target.value);
                  setFormData({
                    ...formData,
                    nim: e.target.value,
                    status_awal: student?.status_aktif || '',
                  });
                }}
                required
              >
                {students?.map((student) => (
                  <MenuItem key={student.nim} value={student.nim}>
                    {student.nim} - {student.nama} ({student.status_aktif})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>New Status</InputLabel>
              <Select
                value={formData.status_baru}
                label="New Status"
                onChange={(e) =>
                  setFormData({ ...formData, status_baru: e.target.value })
                }
                required
              >
                <MenuItem value="AKTIF">Active</MenuItem>
                <MenuItem value="TIDAK AKTIF">Inactive</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default StudentStatus; 