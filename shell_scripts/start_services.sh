pm2 start ./backend/gateway/server.js --name RT-Express-Gateway --restart-delay=3000
pm2 start ./backend/services/GeneralService.js --name RT-General-Service --restart-delay=3000
pm2 start ./backend/services/UserService.js --name RT-User-Service --restart-delay=3000
pm2 start ./backend/services/AdminService.js --name RT-Admin-Service --restart-delay=3000
pm2 start ./backend/services/OrderService.js --name RT-Order-Service --restart-delay=3000
