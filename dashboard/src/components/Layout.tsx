import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Badge,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory2Outlined,
  LocalShippingOutlined,
  MapOutlined,
  WarningAmberOutlined,
  AssessmentOutlined,
  BusinessOutlined,
  NotificationsOutlined,
  Logout,
  Person,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 260;

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/stock-map', label: 'National Stock Map', icon: <MapOutlined /> },
  { path: '/stock', label: 'Stock Levels', icon: <Inventory2Outlined /> },
  { path: '/consignments', label: 'Consignments', icon: <LocalShippingOutlined /> },
  { path: '/reorder', label: 'Reorder Alerts', icon: <WarningAmberOutlined /> },
  { path: '/compliance', label: 'e-GP Compliance', icon: <AssessmentOutlined /> },
  { path: '/suppliers', label: 'Suppliers', icon: <BusinessOutlined /> },
  { path: '/impact', label: 'Impact & ROI', icon: <TrendingUp /> },
];

export default function Layout({ children }: LayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="img"
          src="/logo.png"
          sx={{ width: 40, height: 40, borderRadius: 1 }}
        />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1A365D', lineHeight: 1.2 }}>
            HealthBridge
          </Typography>
          <Typography variant="caption" sx={{ color: '#718096', fontSize: 11 }}>
            MedTrack Dashboard
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 1.5, py: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive ? '#EBF4FF' : 'transparent',
                  '&:hover': { bgcolor: isActive ? '#EBF4FF' : '#F7FAFC' },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? '#2B6CB0' : '#718096',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#2B6CB0' : '#4A5568',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ color: '#A0AEC0' }}>
          v1.0.0 | Zimbabwe
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F7FAFC' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(226,232,240,0.6)',
          ml: { md: `${drawerWidth}px` },
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' }, color: '#1A202C' }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{ flex: 1, color: '#1A202C', fontWeight: 600, fontSize: 18 }}
          >
            {navItems.find((i) => i.path === location.pathname)?.label || 'Dashboard'}
          </Typography>
          <IconButton sx={{ mr: 1 }} onClick={() => navigate('/notifications')}>
            <Badge badgeContent={3} color="error">
              <NotificationsOutlined />
            </Badge>
          </IconButton>
          <Chip
            avatar={<Avatar sx={{ bgcolor: '#2B6CB0' }}>{user?.name?.charAt(0) || 'U'}</Avatar>}
            label={user?.name || 'User'}
            variant="outlined"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ borderRadius: 2, '& .MuiChip-avatar': { width: 28, height: 28 } }}
          />
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem disabled>
              <Person sx={{ mr: 1, fontSize: 20 }} />
              {user?.role?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1, fontSize: 20 }} />
              Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: drawerWidth } }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            open
            sx={{
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                borderRight: '1px solid #E2E8F0',
              },
            }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flex: 1,
          p: 3,
          mt: '64px',
          ml: 0,
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
