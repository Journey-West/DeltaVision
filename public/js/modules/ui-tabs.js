/**
 * Tab navigation functionality module
 */
export function initTabs() {
    // Set up filter tab navigation
    function setupFilterTabs() {
        const tabs = document.querySelectorAll('.filter-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetId = this.dataset.target;
                
                // Remove active class from all tabs and content
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.filter-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and its content
                this.classList.add('active');
                document.getElementById(targetId)?.classList.add('active');
            });
        });
    }
    
    // Initial setup
    document.addEventListener('DOMContentLoaded', setupFilterTabs);
    
    // We also need to set up the tabs after the components are loaded
    // This is because the tabs are loaded asynchronously via fetch
    setTimeout(setupFilterTabs, 500);
    
    return {
        setupFilterTabs
    };
}
