# Teams connector

## Download the project

Before start, download the code from github
https://github.com/eva-professional-services/eva-teams

- Open your terminal or command prompt.
- Navigate to the directory where you want to clone the repository.
- Run the following command:

        git clone https://github.com/eva-professional-services/eva-teams.git

- Change to the repository directory:

        cd eva-teams


This project employs a virtual agent develop in eva (https://eva.bot/), which integrates seamlessly with the Microsoft Bot Framework (https://dev.botframework.com/). Additionally, MongoDB serves as the project's primary database solution. More about MongoDB can be explored at https://www.mongodb.com/es."

In the project folder is located the **.env** file, this file must be populated with the appropriate keys and configuration values.

## 1. Create a virtual agent in eva


### 1.1 Environment selection
Upon login, use the ORGANIZATION NAME to populate the variable **realms** in the **.env** file

Once you have logged into eva platform website you will see a list with your environments. Before selecting the environment go to upper-left key icon to get the organization key, populate the variable **orguuid** in the **.env** file. 

From the environment list, before selecting an environment to create the virtual agent, look at the 3 columns:
- The value from column "INSTANCE" should be to populate the variable **envURL** in the **.env** file
- the value from column "KEY ENVIRONMENTS" will be used to populate the variable **envuuid** in the **.env** file

![step1](/img%20tutorial/3-%20choose%20environment%20to%20create%20a%20virtual%20agent.png)

### 1.2 Get the APIKEY
Once selected the eva environment, go to upper-left key icon to get API key, this values should be used to populate the variable **APIKEY** in the **.env** file. 

![step1](/img%20tutorial/3-get%20environment%20key.png)

### 1.3 Create the virtual agent
Create a new virtual virtual agent and press "Add a Channel", choose "Microsoft Teams" in the Channel combobox. set a name for this channel, this name should be used to populate the variable **CHANNEL** in the **.env**
If you are using an existing virtual agent you create this new Channel at any moment in the virtual agent lateral menu in the cockpit.

![step1](/img%20tutorial/3-create%20bot%20in%20eva.png)

### 1.4 Get the botid
After the creation of the virtual agent, you will be redirected to the virtual agent main page, in the upper-left a key icon contains the Virtual Agent Key, this value should be used to populate the variable *botid* in the **.env** file

![step1](/img%20tutorial/3-bot%20page%20detail.png)

### 1.5 Client ID and Secret

To populate the **AUTH_CLIENT_SECRET**, the **AUTH_CLIENT_ID** and the **AUTH_URL** variables from the **.env** file you need to make a request to eva Support Team. This values are unique per organization and work for all the virtual agents on it.

- To request the client secret, client id and auth URl you will need an account to access Jira: check this link for instruction [ticket support accounts](https://docs.eva.bot/read/eva-support/support-procedures/portal-user-request)<br />
- Once in Jira, create a ticket for "Problems in cockpit" category, fill the form following this [instructions](https://docs.eva.bot/read/eva-support/support-procedures/tickets-creation) and request the values

## 2. Setting up MongoDB using MongoDB Atlas

### 2.1 Register & Login
- Register for an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- Log in to your MongoDB Atlas account.

### 2.2 Create a New Cluster
- Click on the "Build a Cluster" option.
- Select your preferred cloud provider and region.
- choose the name of the cluster and press "Create Cluster".

### 2.3 Whitelist Your IP Address
- In the cluster dashboard, click on "Connect".
- Click on "Add Your Current IP Address". This will allow your current computer to access the database.

### 2.4 Create a Database User
- Still in the "Connect" window, go to the "Choose a connection method" step.
- Click on "Add a database user".
- Enter a username and a strong password. 

### 2.5 Create a Database & Collection
- If you want, create an empty collection

### 2.6 Populate the mongodb section of the .env file

- User, Password and Cluster are part of the **MongoUri** variable
- The database name goes in **MongoDb** variable
- The collection database goes in **MongoCollection**

### Further Information
If you're interested in setting up a local MongoDB instance or need more in-depth information on MongoDB configurations, please refer to the [official MongoDB documentation](https://docs.mongodb.com/manual/).



## 3. Create Azure bot
### 3.1 Deployment
You will need to login in your Azure account, be sure to have Application registration permissions in your Azure Active Directory.

Look for the resource called Azure bot
![step3](/img%20tutorial/1-create%20bot.png)

- Be sure to choose "Multitenant" option 
- Select the resource group or create a new one
- Choose the "Create new Microsoft APP ID" option 
![step3](/img%20tutorial/2-create%20bot.png)

### 3.4 Get the App ID
After the Azure bot is created, go to the resource and look for Setting->Configuration section in the left menu. 

In the setting page, use the **Microsoft App ID** value to populate the variable **MicrosoftAppId** from **.env** file.

### 3.5 Get the Client Secret
Next to the *Microsoft App ID* tag, Click the link "Manage Password" to go to the *Certificate & Secret* section.
Click on "New Client Secret" and choose a name for the client secret
![step 3.5](/img%20tutorial/4-add%20client%20secret.png)
Once the Client Secret is created, copy the key from "Value" column. This should be used to populate the variable **MicrosoftAppPassword** from the **.env** file 

### 3.6 Get the Tenant ID
After getting the Client secret, look in the left menu for first section called "Overview" 
In the Overview page, look for the value of the "Directory (tenant) ID". This should be used to populate variable **MicrosoftTenantID** from **.env** file

## 5. Cloud Function
In this example, lets create a Cloud Function in GCP (you can also use another webhook technology or Cloud Provider)<br />

## Deploying to Google Cloud Functions

If you haven't already, install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install).

Authenticate with Google Cloud:

        gcloud auth login

Set your GCP project:

        gcloud config set project YOUR_PROJECT_ID


if the console is not in the eva-teams folder, navigate to this directory.

Deploy the function:

        gcloud functions deploy myFunction 
        --runtime nodejs18 
        --trigger-http 
        --allow-unauthenticated

**Note**: *--allow-unauthenticate* will makes the function publicly accessible. Be cautious with this; for production use-cases, you'd likely want to implement authentication.

## 6. Config the Azure bot
In the Azure bot, go to Configuration section and populate the field *Messaging endpoint* with the URL from the Cloud Function

It should be something like this,https://us-central1-projectName.cloudfunctions.net/teams_azurebot_eva/conversation


## 7. Create the teams channel
Just below the *Configuration* section in the Azure bot menu, go to *Channels* section.<br />
Under **Available Channels**, scroll down and select Microsoft Teams. Accept the Terms and press **Apply**

![step 7](/img%20tutorial/step7-set%20channel.png)

Once the channel is created, press the "X Close" button next to the search bar or refresh the site to show the channels again, this time with the Microsoft Teams as a current channel for the Azure bot
![step 7](/img%20tutorial/step7-set%20channel.png)

The link under the Action Column for the Teams Channel, "Open in Teams" is an easy to test the bot directly in Teams. It will redirect you to Teams and the bot will work like a Teams app.

## 8. More about Microsoft Teams
Microsoft Teams allows you to create applications in different ways, here you can find more information [Microsoft teams](https://learn.microsoft.com/en-us/microsoftteams/platform/mstdd-landing)


  
