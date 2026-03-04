let robotService;

class RobotService {
    getRobotStatuses() {
        const url = `${config.baseUrl}/robot/status`;
        return axios.get(url, { headers: userService.getHeaders() });
    }

    getRobotStatusById(robotId) {
        const url = `${config.baseUrl}/robot/status/${robotId}`;
        return axios.get(url, { headers: userService.getHeaders() });
    }

    updateRobotStatus(robotId, payload) {
        const url = `${config.baseUrl}/robot/status/${robotId}`;
        return axios.put(url, payload, { headers: userService.getHeaders() });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    robotService = new RobotService();
});
