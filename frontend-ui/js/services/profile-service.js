let profileService;

class ProfileService
{
    lastProfile = null;

    loadProfile()
    {
        const url = `${config.baseUrl}/profile`;

        const headers = (typeof userService !== 'undefined') ? userService.getHeaders() : {};
        axios.get(url, { headers })
             .then(response => {
                 this.lastProfile = response.data;
                 const raw = response.data || {};
                 const data = {
                     userId: raw.userId ?? '',
                     firstName: raw.firstName ?? '',
                     lastName: raw.lastName ?? '',
                     phone: raw.phone ?? '',
                     email: raw.email ?? '',
                     nameOnCard: raw.nameOnCard ?? '',
                     cardNumberLast4: raw.cardNumberLast4 ?? '',
                     cardNumberDisplay: raw.cardNumberLast4 ? '•••• ' + raw.cardNumberLast4 : '',
                     expMonth: raw.expMonth ?? '',
                     expYear: raw.expYear ?? '',
                     billingAddress: raw.billingAddress ?? '',
                     billingCity: raw.billingCity ?? '',
                     billingState: raw.billingState ?? '',
                     billingZip: raw.billingZip ?? '',
                     billingCountry: raw.billingCountry ?? '',
                     address: raw.address ?? '',
                     city: raw.city ?? '',
                     state: raw.state ?? '',
                     zip: raw.zip ?? '',
                     deliveryCountry: raw.deliveryCountry ?? ''
                 };
                 templateBuilder.build("profile", data, "main")
             })
             .catch(error => {
                 const emptyProfile = {
                     userId: '', firstName: '', lastName: '', phone: '', email: '', nameOnCard: '', cardNumberLast4: '', cardNumberDisplay: '',
                     expMonth: '', expYear: '', billingAddress: '', billingCity: '', billingState: '', billingZip: '', billingCountry: '',
                     address: '', city: '', state: '', zip: '', deliveryCountry: ''
                 };
                 templateBuilder.build("profile", emptyProfile, "main");
                 templateBuilder.append("error", { error: "Could not load profile. You can fill the form and click Update to save." }, "errors");
             })
    }

    loadProfileForFlow()
    {
        const url = `${config.baseUrl}/profile`;
        const headers = (typeof userService !== 'undefined') ? userService.getHeaders() : {};
        return axios.get(url, { headers })
             .then(response => {
                 this.lastProfile = response.data;
             })
             .catch(() => { this.lastProfile = null; })
    }

    updateProfile(profile)
    {
        const url = `${config.baseUrl}/profile`;
        const headers = (typeof userService !== 'undefined') ? userService.getHeaders() : {};
        axios.put(url, profile, { headers })
             .then(() => {
                 const data = {
                     message: "The profile has been updated."
                 };

                 templateBuilder.append("message", data, "errors")
             })
             .catch(error => {
                 const data = {
                     error: "Save profile failed."
                 };

                 templateBuilder.append("error", data, "errors")
             })
    }
}

document.addEventListener("DOMContentLoaded", () => {
   profileService = new ProfileService();
});
