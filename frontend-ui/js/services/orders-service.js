let ordersService;

class OrdersService {
    getOrders() {
        const url = `${config.baseUrl}/orders`;
        return axios.get(url, { headers: userService.getHeaders() });
    }

    getOrderById(orderId) {
        const url = `${config.baseUrl}/orders/${orderId}`;
        return axios.get(url, { headers: userService.getHeaders() });
    }

    createOrder(order) {
        const url = `${config.baseUrl}/orders`;
        return axios.post(url, order, { headers: userService.getHeaders() });
    }

    updateOrderStatus(orderId, status) {
        const url = `${config.baseUrl}/orders/${orderId}`;
        return axios.put(url, { status }, { headers: userService.getHeaders() });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ordersService = new OrdersService();
});
