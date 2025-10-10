import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Flex,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Badge,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Textarea,
  Select,
  Switch,
  Alert,
  AlertIcon,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Divider,
} from '@chakra-ui/react';
import api from '../../services/api';

const SchedulingPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [scheduledArticles, setScheduledArticles] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOpen: isScheduleModalOpen, onOpen: onScheduleModalOpen, onClose: onScheduleModalClose } = useDisclosure();
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    frequency: 'hourly',
    custom_interval_minutes: 60,
    forbidden_hours_start: '',
    forbidden_hours_end: '',
    max_articles_per_day: '',
    queue_priority: 50,
    is_active: true
  });
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, scheduledRes, statsRes] = await Promise.all([
        api.get('/articles/schedules/'),
        api.get('/articles/scheduled-articles/'),
        api.get('/articles/schedule-stats/')
      ]);
      
      setSchedules(schedulesRes.data.results || schedulesRes.data);
      setScheduledArticles(scheduledRes.data.results || scheduledRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError('Failed to fetch scheduling data');
      console.error('Error fetching scheduling data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSchedule = async (scheduleId, isActive) => {
    try {
      await api.patch(`/articles/schedules/${scheduleId}/`, { is_active: !isActive });
      fetchData();
    } catch (err) {
      setError('Failed to toggle schedule');
      console.error('Error toggling schedule:', err);
    }
  };

  const processScheduledArticles = async () => {
    try {
      const response = await api.post('/articles/process-scheduled/');
      toast({
        title: 'Articles processed successfully',
        description: `Processed ${response.data.published} articles`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchData();
    } catch (err) {
      setError('Failed to process scheduled articles');
      toast({
        title: 'Error processing articles',
        description: 'Failed to process scheduled articles',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error('Error processing articles:', err);
    }
  };

  const cancelScheduledArticle = async (scheduledArticleId) => {
    if (!confirm('Are you sure you want to cancel this scheduled article?')) {
      return;
    }
    
    try {
      await api.post(`/articles/cancel/${scheduledArticleId}/`);
      fetchData();
    } catch (err) {
      setError('Failed to cancel scheduled article');
      console.error('Error cancelling article:', err);
    }
  };

  const openScheduleModal = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setScheduleForm({
        name: schedule.name,
        frequency: schedule.frequency,
        custom_interval_minutes: schedule.custom_interval_minutes || 60,
        forbidden_hours_start: schedule.forbidden_hours_start || '',
        forbidden_hours_end: schedule.forbidden_hours_end || '',
        max_articles_per_day: schedule.max_articles_per_day || '',
        queue_priority: schedule.queue_priority || 50,
        is_active: schedule.is_active
      });
    } else {
      setEditingSchedule(null);
      setScheduleForm({
        name: '',
        frequency: 'hourly',
        custom_interval_minutes: 60,
        forbidden_hours_start: '',
        forbidden_hours_end: '',
        max_articles_per_day: '',
        queue_priority: 50,
        is_active: true
      });
    }
    onScheduleModalOpen();
  };

  const closeScheduleModal = () => {
    onScheduleModalClose();
    setEditingSchedule(null);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...scheduleForm,
        max_articles_per_day: scheduleForm.max_articles_per_day ? parseInt(scheduleForm.max_articles_per_day) : null,
        custom_interval_minutes: scheduleForm.frequency === 'custom' ? parseInt(scheduleForm.custom_interval_minutes) : null,
        forbidden_hours_start: scheduleForm.forbidden_hours_start || null,
        forbidden_hours_end: scheduleForm.forbidden_hours_end || null,
      };

      if (editingSchedule) {
        await api.patch(`/articles/schedules/${editingSchedule.id}/`, data);
        toast({
          title: 'Schedule updated successfully',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } else {
        await api.post('/articles/schedules/', data);
        toast({
          title: 'Schedule created successfully',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
      
      closeScheduleModal();
      fetchData();
    } catch (err) {
      setError('Failed to save schedule');
      toast({
        title: 'Error saving schedule',
        description: 'Failed to save schedule',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error('Error saving schedule:', err);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/articles/schedules/${scheduleId}/`);
      fetchData();
    } catch (err) {
      setError('Failed to delete schedule');
      console.error('Error deleting schedule:', err);
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString();
  };

  const formatTime = (time) => {
    if (!time) return 'Not set';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center">
          <Spinner size="xl" />
          <Text mt={4}>Loading scheduling data...</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="xl" mb={2}>Article Scheduling</Heading>
          <Text color="gray.600">Manage publishing schedules and scheduled articles</Text>
        </Box>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Statistics */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={6}>
          <Card>
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">{stats.total_scheduled || 0}</Text>
              <Text color="gray.600">Total Scheduled</Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="green.600">{stats.published_today || 0}</Text>
              <Text color="gray.600">Published Today</Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="yellow.600">{stats.queued || 0}</Text>
              <Text color="gray.600">Queued</Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="red.600">{stats.failed || 0}</Text>
              <Text color="gray.600">Failed</Text>
            </CardBody>
          </Card>
        </Grid>

        {/* Process Button */}
        <Box>
          <Button
            colorScheme="blue"
            onClick={processScheduledArticles}
            size="lg"
          >
            Process Scheduled Articles
          </Button>
        </Box>

        {/* Publishing Schedules */}
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="lg">Publishing Schedules</Heading>
            <Button
              colorScheme="green"
              onClick={() => openScheduleModal()}
              leftIcon={<span>➕</span>}
            >
              Create New Schedule
            </Button>
          </Flex>
          <Card>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Frequency</Th>
                  <Th>Status</Th>
                  <Th>Forbidden Hours</Th>
                  <Th>Daily Limit</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {schedules.map((schedule) => (
                  <Tr key={schedule.id}>
                    <Td fontWeight="medium">{schedule.name}</Td>
                    <Td>
                      {schedule.frequency === 'custom' 
                        ? `${schedule.custom_interval_minutes} minutes`
                        : schedule.frequency
                      }
                    </Td>
                    <Td>
                      <Badge colorScheme={schedule.is_active ? 'green' : 'gray'}>
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </Td>
                    <Td>
                      {schedule.forbidden_hours_start && schedule.forbidden_hours_end
                        ? `${formatTime(schedule.forbidden_hours_start)} - ${formatTime(schedule.forbidden_hours_end)}`
                        : 'None'
                      }
                    </Td>
                    <Td>{schedule.max_articles_per_day || 'No limit'}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme={schedule.is_active ? 'red' : 'green'}
                          variant="outline"
                          onClick={() => toggleSchedule(schedule.id, schedule.is_active)}
                        >
                          {schedule.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => openScheduleModal(schedule)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => deleteSchedule(schedule.id)}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </Box>

        {/* Scheduled Articles */}
        <Box>
          <Heading size="lg" mb={4}>Scheduled Articles</Heading>
          <Card>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Article</Th>
                  <Th>Schedule</Th>
                  <Th>Status</Th>
                  <Th>Scheduled Time</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {scheduledArticles.map((scheduledArticle) => (
                  <Tr key={scheduledArticle.id}>
                    <Td fontWeight="medium">{scheduledArticle.article.title}</Td>
                    <Td>{scheduledArticle.schedule.name}</Td>
                    <Td>
                      <Badge colorScheme={
                        scheduledArticle.status === 'published' 
                          ? 'green'
                          : scheduledArticle.status === 'failed'
                          ? 'red'
                          : scheduledArticle.status === 'cancelled'
                          ? 'gray'
                          : 'yellow'
                      }>
                        {scheduledArticle.status}
                      </Badge>
                    </Td>
                    <Td>{formatDateTime(scheduledArticle.scheduled_publish_time)}</Td>
                    <Td>
                      {scheduledArticle.status === 'scheduled' && (
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => cancelScheduledArticle(scheduledArticle.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </Box>
      </VStack>

      {/* Schedule Management Modal */}
      <Modal isOpen={isScheduleModalOpen} onClose={closeScheduleModal} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Schedule Name</FormLabel>
                <Input
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm({...scheduleForm, name: e.target.value})}
                  placeholder="Enter schedule name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Frequency</FormLabel>
                <Select
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm({...scheduleForm, frequency: e.target.value})}
                >
                  <option value="instant">Instant</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="custom">Custom Interval</option>
                </Select>
              </FormControl>

              {scheduleForm.frequency === 'custom' && (
                <FormControl isRequired>
                  <FormLabel>Custom Interval (minutes)</FormLabel>
                  <Input
                    type="number"
                    min="1"
                    value={scheduleForm.custom_interval_minutes}
                    onChange={(e) => setScheduleForm({...scheduleForm, custom_interval_minutes: e.target.value})}
                  />
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Forbidden Hours Start</FormLabel>
                <Input
                  type="time"
                  value={scheduleForm.forbidden_hours_start}
                  onChange={(e) => setScheduleForm({...scheduleForm, forbidden_hours_start: e.target.value})}
                />
                <FormHelperText>Leave empty for no restrictions</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Forbidden Hours End</FormLabel>
                <Input
                  type="time"
                  value={scheduleForm.forbidden_hours_end}
                  onChange={(e) => setScheduleForm({...scheduleForm, forbidden_hours_end: e.target.value})}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Daily Article Limit</FormLabel>
                <Input
                  type="number"
                  min="1"
                  value={scheduleForm.max_articles_per_day}
                  onChange={(e) => setScheduleForm({...scheduleForm, max_articles_per_day: e.target.value})}
                  placeholder="No limit"
                />
                <FormHelperText>Leave empty for no daily limit</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Queue Priority</FormLabel>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={scheduleForm.queue_priority}
                  onChange={(e) => setScheduleForm({...scheduleForm, queue_priority: e.target.value})}
                />
                <FormHelperText>Lower numbers = higher priority (1-100)</FormHelperText>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Active</FormLabel>
                <Switch
                  isChecked={scheduleForm.is_active}
                  onChange={(e) => setScheduleForm({...scheduleForm, is_active: e.target.checked})}
                  colorScheme="blue"
                />
                <Text ml={2} fontSize="sm" color="gray.600">
                  Schedule will be used for new articles
                </Text>
              </FormControl>

              <HStack spacing={4} w="full">
                <Button onClick={closeScheduleModal} flex="1">
                  Cancel
                </Button>
                <Button 
                  colorScheme="blue" 
                  flex="1" 
                  onClick={handleScheduleSubmit}
                >
                  {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default SchedulingPage;
