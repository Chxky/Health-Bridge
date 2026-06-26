import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Button,
  Fade,
  Divider,
} from '@mui/material';
import {
  WarningAmberOutlined,
  CheckCircleOutline,
  InfoOutlined,
  ErrorOutline,
  DoneAll,
  DeleteOutline,
} from '@mui/icons-material';
import { getNotifications } from '../services/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <ErrorOutline sx={{ color: '#E53E3E' }} />;
      case 'warning': return <WarningAmberOutlined sx={{ color: '#DD6B20' }} />;
      case 'success': return <CheckCircleOutline sx={{ color: '#38A169' }} />;
      default: return <InfoOutlined sx={{ color: '#3182CE' }} />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'critical': return '#FED7D7';
      case 'warning': return '#FEEBC8';
      case 'success': return '#C6F6D5';
      default: return '#BEE3F8';
    }
  };

  return (
    <Box>
      <Fade in={true} timeout={500}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A365D' }}>
              Notifications
            </Typography>
            <Typography variant="body1" sx={{ color: '#718096', mt: 0.5 }}>
              Stay updated with system alerts and activities.
            </Typography>
          </Box>
          <Button 
            startIcon={<DoneAll />} 
            onClick={markAllAsRead}
            variant="outlined"
            sx={{ borderRadius: 2, color: '#4A5568', borderColor: '#CBD5E0' }}
          >
            Mark all as read
          </Button>
        </Box>
      </Fade>

      <Fade in={true} timeout={700}>
        <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <List disablePadding>
            {notifications.map((notif, index) => (
              <React.Fragment key={notif.id}>
                <ListItem
                  sx={{
                    p: 3,
                    bgcolor: notif.read ? 'transparent' : 'rgba(49, 130, 206, 0.04)',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                  }}
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" size="small" sx={{ color: '#A0AEC0' }}>
                      <DeleteOutline />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getBgColor(notif.type) }}>
                      {getIcon(notif.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: notif.read ? 500 : 700, color: '#2D3748' }}>
                          {notif.title}
                        </Typography>
                        {!notif.read && (
                          <Chip label="New" size="small" sx={{ bgcolor: '#3182CE', color: 'white', height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#4A5568', mb: 1 }}>
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#A0AEC0', fontWeight: 500 }}>
                          {notif.time}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
          {notifications.length === 0 && (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <InfoOutlined sx={{ fontSize: 48, color: '#CBD5E0', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#718096' }}>No notifications</Typography>
              <Typography variant="body2" sx={{ color: '#A0AEC0' }}>You're all caught up!</Typography>
            </Box>
          )}
        </Card>
      </Fade>
    </Box>
  );
}
