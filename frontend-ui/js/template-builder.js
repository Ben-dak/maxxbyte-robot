let templateBuilder = {};

class TemplateBuilder
{
    build(templateName, value, target, callback)
    {
        const targetEl = document.getElementById(target);
        if (!targetEl) return;
        axios.get(`templates/${templateName}.html`)
            .then(response => {
                try
                {
                    const template = response.data;
                    const html = Mustache.render(template, value);
                    targetEl.innerHTML = html;

                    if(callback) callback();
                }
                catch(e)
                {
                    console.error('Template render error', e);
                }
            })
            .catch(err => {
                console.error('Failed to load template: ' + templateName, err);
                if (target === 'main') {
                    targetEl.innerHTML = '<div class="alert alert-danger">Could not load this screen. If you opened the app as a file, run it from a local server (e.g. Live Server) instead.</div>';
                }
            });
    }

    clear(target)
    {
        document.getElementById(target).innerHTML = "";
    }

    append(templateName, value, target)
    {
        axios.get(`templates/${templateName}.html`)
             .then(response => {
                 try
                 {
                     const template = response.data;
                     const html = Mustache.render(template, value);

                     const element = this.createElementFromHTML(html);
                     const parent = document.getElementById(target);
                     parent.appendChild(element);

                     if(target == "errors")
                     {
                         setTimeout(() => {
                             parent.removeChild(element);
                         }, 3000);
                     }
                 }
                 catch(e)
                 {
                     console.log(e);
                 }
             })
    }

    createElementFromHTML(htmlString)
    {
        const div = document.createElement('div');
        div.innerHTML = htmlString.trim();

        // Change this to div.childNodes to support multiple top-level nodes.
        return div.firstChild;
    }

}

document.addEventListener('DOMContentLoaded', () => {
    templateBuilder = new TemplateBuilder();
});
