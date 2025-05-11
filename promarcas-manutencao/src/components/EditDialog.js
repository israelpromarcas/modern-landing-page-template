import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
} from '@mui/material';

const EditDialog = ({
  open,
  onClose,
  title,
  fields,
  values,
  onChange,
  onSave,
  error,
  loading = false,
  fullWidth = true,
  maxWidth = 'sm',
}) => {
  const handleChange = (fieldName, value) => {
    onChange({ ...values, [fieldName]: value });
  };

  const renderField = (field) => {
    const { name, label, type = 'text', required = false, options, disabled = false } = field;
    
    if (type === 'select') {
      return (
        <FormControl fullWidth key={name}>
          <InputLabel>{label}</InputLabel>
          <Select
            value={values[name] || ''}
            onChange={(e) => handleChange(name, e.target.value)}
            label={label}
            required={required}
            disabled={disabled || loading}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    return (
      <TextField
        key={name}
        fullWidth
        label={label}
        type={type}
        value={values[name] || ''}
        onChange={(e) => handleChange(name, e.target.value)}
        required={required}
        disabled={disabled || loading}
      />
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
    >
      <DialogTitle>
        <Typography variant="h6">{title}</Typography>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {fields.map((field) => (
            <Grid item xs={12} sm={field.fullWidth ? 12 : 6} key={field.name}>
              {renderField(field)}
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDialog;
