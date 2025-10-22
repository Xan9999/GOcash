import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(40, 44, 52, 0.5)',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: 'rgba(40, 44, 52, 0.5)',
  },
  homeContainer: {
    flex: 1,
    backgroundColor: 'rgba(40, 44, 52, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    marginVertical: 40,
  },
  sendButton: {
    backgroundColor: '#61dafb',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: 200,
  },
  receiveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: 200,
  },
  splitButton: {
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 8,
    width: 200,
  },
  pendingButton: {
    backgroundColor: '#FF9800',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  pendingText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    left: 20,
    zIndex: 1,
  },
  backText: {
    color: '#61dafb',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: Platform.OS === 'web' ? 20 : 60,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  recipientInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  recipientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#282c34',
    marginBottom: 5,
  },
  recipientPhone: {
    fontSize: 16,
    color: '#666',
  },
  amountContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#282c34',
    marginBottom: 10,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 4,
    fontSize: 18,
    textAlign: 'center',
  },
  confirmButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  requestRow: {
    backgroundColor: 'white',
    marginVertical: 8,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
  },
  requestRequester: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#282c34',
  },
  requestAmount: {
    fontSize: 16,
    color: '#4CAF50',
    marginVertical: 5,
  },
  requestTime: {
    fontSize: 14,
    color: '#666',
  },
  requestButtons: {
    flexDirection: 'row',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 4,
    marginLeft: 10,
  },
  denyButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 4,
    marginLeft: 10,
  },
  approveText: {
    color: 'white',
    fontWeight: 'bold',
  },
  denyText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  loginList: {
    flex: 1,
  },
  loginRow: {
    backgroundColor: 'white',
    marginVertical: 8,
    padding: 15,
    borderRadius: 8,
  },
  loginName: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  loginDetail: {
    color: '#666',
    fontSize: 14,
  },
  list: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  row: {
    backgroundColor: 'white',
    marginVertical: 8,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitSelectedRow: {
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  disabledRow: {
    opacity: 0.5,
    backgroundColor: '#f0f0f0',
  },
  cell: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    color: '#000000ff',
    fontSize: 24,
  },
  label: {
    fontWeight: 'bold',
    color: '#838383ff',
    fontSize: 15,
    marginTop: 5,
  },
  smallBalance: {
    marginTop: 6,
    color: '#444',
  },
  actionText: {
    color: '#61dafb',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledText: {
    color: '#999',
  },
  message: {
    color: '#61dafb',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    padding: 10,
  },
  loadingText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
  },
  loadingSpinner: {
    marginTop: 10,
  },
  logoutButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 40,
    right: 20,
    zIndex: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#f44336',
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginVertical: 8,
    padding: 15,
    borderRadius: 8,
  },
  sliderContainer: {
    alignItems: 'center',
    width: 150,
    marginLeft: 20,
  },
  slider: {
    width: 120,
    height: 50,
  },
});

export default styles;
